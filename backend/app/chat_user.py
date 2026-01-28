from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import case, func, or_
from typing import List
from models.sql_tables import User, Message

async def get_chat_users(username: str, db: AsyncSession):
    # 1. Get current user ID
    result_user = await db.execute(select(User).where(User.username == username))
    current_user = result_user.scalars().first()
    
    if not current_user:
        return []
        
    user_id = current_user.id

    # 2. Subquery to find last message time per contact
    # logic: if sender=me, other=receiver. else other=sender.
    other_user_id = case(
        (Message.sender_id == user_id, Message.receiver_id),
        else_=Message.sender_id
    ).label("other_user_id")

    stmt = (
        select(
            other_user_id,
            func.max(Message.timestamp).label("last_msg_time")
        )
        .where(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        )
        .group_by(other_user_id)
        .subquery()
    )

    # 3. Join with User table and order by last_msg_time
    query = (
        select(User)
        .join(stmt, User.id == stmt.c.other_user_id)
        .order_by(stmt.c.last_msg_time.desc())
    )

    result = await db.execute(query)
    return result.scalars().all()