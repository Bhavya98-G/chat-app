from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sql_tables import Conversation, Message, MessageStatus
from app.chat.conversation_service import get_member_ids

async def save_message(db, conversation_id, sender_id, content):
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        type="text"
    )
    db.add(msg)
    await db.flush()
    members = await get_member_ids(db, conversation_id)
    for user_id in members:
        if user_id != sender_id:
            db.add(MessageStatus(
                message_id=msg.id, 
                user_id=user_id,
                status="unread"
            )) 
    conv = await db.get(Conversation, conversation_id)
    if conv is not None:
        conv.last_message_at = func.now()
    await db.commit()
    await db.refresh(msg)
    return msg 

async def mark_read(db, user_id, conversation_id):
    msg_ids = select(Message.id).where(
        Message.conversation_id == conversation_id
    )
    stmt = (
        update(MessageStatus)
        .where(
            MessageStatus.user_id ==  user_id,
            MessageStatus.message_id.in_(msg_ids),
            MessageStatus.status != "read",
        )
        .values(status="read")
    )
    await db.execute(stmt)
    await db.commit()
    
async def get_history(db, conversation_id, limit=50):
    messages = await db.execute(select(Message).where(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.asc(), Message.id.asc())
    .limit(limit))
    return list(messages.scalars().all())