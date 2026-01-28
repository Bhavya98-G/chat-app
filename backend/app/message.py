from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from core.database import get_db
from models.sql_tables import Message
from typing import List

router = APIRouter(tags=["messages"], prefix="/messages")

@router.get("/{user_id}/{contact_id}")
async def get_chat_history(user_id: int, contact_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Message).where(
        or_(
            and_(
                Message.sender_id == user_id,
                Message.receiver_id == contact_id
            ),
            and_(
                Message.sender_id == contact_id,
                Message.receiver_id == user_id
            )
        )
    ).order_by(Message.timestamp.asc())
    result = await db.execute(query)
    return result.scalars().all()