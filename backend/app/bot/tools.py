from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import aliased

from app.core.database import AsyncSessionLocal
from app.models.sql_tables import (
    User,
    Contact,
    Conversation,
    ConversationMember,
    Message,
)


def _display_name(user: User) -> str:
    return f"{user.first_name} {user.last_name or ''}".strip()


@tool
async def get_chat_history(
    contact_name: str,
    user_id: Annotated[int, InjectedState("user_id")],
    limit: int = 20,
) -> str:
    """Look up the user's recent 1:1 message history with one of their contacts.

    Use this when the user asks what they discussed with someone, or to recall
    earlier messages. `contact_name` is the other person's name or the nickname
    the user saved for them (e.g. "Mom", "Alice"). Returns recent messages,
    oldest first.
    """
    like = f"%{contact_name}%"
    # Two aliases of the membership table: one row proving *I* am in the
    # conversation, one row for the *other* member (the peer in a direct chat).
    MeMember = aliased(ConversationMember)
    PeerMember = aliased(ConversationMember)

    async with AsyncSessionLocal() as db:
        stmt = (
            select(Conversation.id, User, Contact.nickname)
            .join(MeMember, MeMember.conversation_id == Conversation.id)
            .join(
                PeerMember,
                and_(
                    PeerMember.conversation_id == Conversation.id,
                    PeerMember.user_id != user_id,
                ),
            )
            .join(User, User.id == PeerMember.user_id)
            .outerjoin(
                Contact,
                and_(Contact.owner_id == user_id, Contact.contact_id == User.id),
            )
            .where(
                Conversation.type == "direct",
                MeMember.user_id == user_id,
                or_(
                    Contact.nickname.ilike(like),
                    User.first_name.ilike(like),
                    User.last_name.ilike(like),
                    func.concat(User.first_name, " ", User.last_name).ilike(like),
                ),
            )
            .order_by(Conversation.last_message_at.desc())
            .limit(1)
        )
        row = (await db.execute(stmt)).first()
        if row is None:
            return f"No conversation found with a contact matching '{contact_name}'."

        conversation_id, peer, nickname = row
        peer_label = nickname or _display_name(peer)

        msgs = (
            (
                await db.execute(
                    select(Message)
                    .where(
                        Message.conversation_id == conversation_id,
                        Message.is_deleted == False,  # noqa: E712
                    )
                    .order_by(Message.created_at.desc(), Message.id.desc())
                    .limit(limit)
                )
            )
            .scalars()
            .all()
        )
        if not msgs:
            return f"You have no messages yet with {peer_label}."

        # Fetched newest-first for the LIMIT; show oldest-first so it reads naturally.
        lines = [
            f"{'You' if m.sender_id == user_id else peer_label}: {m.content}"
            for m in reversed(msgs)
        ]
        return f"Recent messages with {peer_label}:\n" + "\n".join(lines)
