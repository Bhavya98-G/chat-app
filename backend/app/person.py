from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from models.sql_tables import User
from schema.pydantic_model import UserOut
from core.database import get_db
from .chat_user import get_chat_users

router = APIRouter(tags=["user_lists"], prefix="/user_lists")

@router.get("/all_users/{username}", response_model=List[UserOut])
async def get_all_users(username: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.username != username).order_by(User.username))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/chat_user/{username}", response_model=List[UserOut])
async def get_chat_user(username: str, db: AsyncSession = Depends(get_db)):
    try:
        chat_users = await get_chat_users(username, db)
        return chat_users
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


