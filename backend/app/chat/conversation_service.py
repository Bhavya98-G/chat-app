from sqlalchemy import select, func, text, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine
from app.models.sql_tables import Conversation, ConversationMember, User, Contact

class NotAMember(Exception):
    pass

async def get_or_create_direct(db, me, peer) -> Conversation:
    if me == peer :
        raise ValueError("Cannot create a direct conversation with yourself")

    # Make the check-then-insert atomic for this unordered pair. Two near-
    # simultaneous POST /conversations (e.g. React StrictMode firing the chat
    # open effect twice) would otherwise miss the dedup SELECT and both
    # INSERT, creating duplicate direct conversations.
    #
    # MySQL GET_LOCK is bound to a single connection, so the lock must be
    # acquired AND released on the same physical connection. The request's
    # AsyncSession (`db`) returns its connection to the pool on every
    # commit/rollback below, so releasing on `db` would run on a different
    # connection and leak the lock. We therefore hold a dedicated connection
    # for the lock's whole lifetime; it must span the commit so a competing
    # request stays blocked until our INSERT is visible.
    lock_key = f"direct_conv:{min(me, peer)}:{max(me, peer)}"
    lock_conn = await engine.connect()
    try:
        acquired = (await lock_conn.execute(text("SELECT GET_LOCK(:k, 10)"), {"k": lock_key})).scalar()
        if acquired != 1:
            raise RuntimeError(f"could not acquire conversation lock {lock_key}")

        # Drop any REPEATABLE READ snapshot already taken on this session (e.g.
        # by get_current_user) so the dedup read sees a conversation a competing
        # request committed while we were waiting on the lock.
        await db.rollback()
        conv = await db.execute(select(Conversation)
                                .join(
                                    ConversationMember,
                                    (Conversation.id == ConversationMember.conversation_id)
                                )
                                .where(Conversation.type=="direct", ConversationMember.user_id.in_([me, peer]))
                                .group_by(Conversation.id)
                                .having(func.count(func.distinct(ConversationMember.user_id))==2)
                                )
        existing = conv.scalars().first()
        if existing:
            return existing
        conv = Conversation(type="direct", created_by=me)
        db.add(conv)
        await db.flush()
        db.add_all([
            ConversationMember(conversation_id=conv.id, user_id=me),
            ConversationMember(conversation_id=conv.id, user_id=peer)
        ])
        await db.commit()
        await db.refresh(conv)
        return conv
    finally:
        try:
            await lock_conn.execute(text("SELECT RELEASE_LOCK(:k)"), {"k": lock_key})
        except Exception:
            pass  # lock also auto-releases when lock_conn closes
        await lock_conn.close()
    
async def get_member_ids(db, conversation_id) -> list[int]:
    members = await db.execute(select(ConversationMember.user_id).where(
        ConversationMember.conversation_id == conversation_id
    ))
    return list(members.scalars().all())

async def assert_member(db, user_id , conversation_id) -> None:
    members = await db.execute(select(ConversationMember.id). where(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id,
    ))
    if members.scalars().first() is None:
        raise NotAMember(f"user both{user_id} not in conversation {conversation_id}")

async def list_conversations(db, me) -> list[dict]:
    my_convs = (
        select(ConversationMember.conversation_id)
        .where(ConversationMember.user_id == me)
        .subquery()
    )
    stmt = (
        select(Conversation, User, Contact.nickname)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .join(User, User.id == ConversationMember.user_id)
        .outerjoin(Contact, and_(Contact.owner_id == me, Contact.contact_id == User.id))
        .where(
            Conversation.id.in_(select(my_convs.c.conversation_id)),
            ConversationMember.user_id != me,
        )
        .order_by(Conversation.last_message_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "conversation_id": conv.id,
            "peer_id": peer.id,
            "peer_name": nickname or f"{peer.first_name} {peer.last_name or ''}".strip(),
            "last_message_at": conv.last_message_at,
        }
        for conv, peer, nickname in rows
    ]
