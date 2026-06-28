from fastapi import APIRouter,  Depends, HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.services import get_current_user
from app.models.sql_tables import User, Contact
from app.chat import conversation_service as cs
from app.chat import message_service as ms
from app.chat import bot_service
from app.chat.schemas import CreateConversation, ConversationOut, MessageOut, UserOut

router = APIRouter(tags=["chat"])

@router.post("/conversations", response_model=ConversationOut)
async def conversation(payload: CreateConversation,
                       current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db),
                       ):
    block = await db.execute(
        select(Contact.id).where(
            or_(
                and_(Contact.owner_id == current_user.id,
                     Contact.contact_id == payload.peer_id,
                     Contact.is_blocked == True),
                and_(Contact.owner_id == payload.peer_id,
                     Contact.contact_id == current_user.id,
                     Contact.is_blocked == True),
            )
        )
    )
    if block.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging is blocked between you and this person",
        )
    try:
        conv = await cs.get_or_create_direct(db, current_user.id, payload.peer_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return ConversationOut(conversation_id=conv.id)

@router.get("/bot", response_model=UserOut)
async def get_bot(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the Texter Bot user so a client can start a chat with it.

    The bot is hidden from /users/search, so this is how the frontend discovers
    its id; opening the chat then uses the normal POST /conversations flow.
    """
    bot_id = await bot_service.get_bot_user_id(db)
    if bot_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bot user not found"
        )
    return await db.get(User, bot_id)


@router.get("/conversations")
async def list_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ):
    return await cs.list_conversations(db, current_user.id)

@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def load_history(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ):
    try:
        await cs.assert_member(db, current_user.id, conversation_id)
    except cs.NotAMember:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")
    return await ms.get_history(db, conversation_id)

@router.get("/users/search", response_model=list[UserOut])
async def search_person(
    q: str  ,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    like = f"%{q}%"
    my_contacts = select(Contact.contact_id).where(
        Contact.owner_id == current_user.id,
    )
    stmt = (
        select(User)
        .where(
            User.id != current_user.id,
            User.role != "bot",
            User.id.notin_(my_contacts),
            or_(User.first_name.ilike(like), User.last_name.ilike(like), User.email.ilike(like)),
        )
        .order_by(User.first_name)
        .limit(20)
    )
    return (await db.execute(stmt)).scalars().all()