import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.models.sql_tables import User
from app.general.schemas import ResponsePhoneNumber, DeletePhoneNumber, ResponseBio, DeleteBio

logger = logging.getLogger(__name__)

async def add_number(user_id: int, 
                     phone_number: str, 
                     db: AsyncSession,) -> ResponsePhoneNumber:
    try:
        user = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User Not found"
            )
        if user.phone_number is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already exists; use update instead"
            )
        user.phone_number = phone_number
        await db.commit()
        return ResponsePhoneNumber(
            phone_number=user.phone_number
        )
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already in use by another account"
        )
    except Exception:
        await db.rollback()
        logger.exception("add_number failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add number"
        )


async def update_number(user_id: int, 
                     phone_number: str, 
                     db: AsyncSession,) -> ResponsePhoneNumber:
    try:
        user = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User Not found"
            )
        
        if user.phone_number is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number not exists"
            )
        user.phone_number = phone_number
        await db.commit()
        return ResponsePhoneNumber(
            phone_number=user.phone_number
        )
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already in use by another account"
        )
    except Exception:
        await db.rollback()
        logger.exception("update_number failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update number"
        )

async def delete_number(user_id: int,
                        db: AsyncSession,)->DeletePhoneNumber:
    try:
        user = await db.execute(select(User).where(User.id==user_id))
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if not user.phone_number:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Phone number not found"
            )
        user.phone_number = None
        await db.commit()
        return DeletePhoneNumber(user_id=user_id)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("delete_number failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete number",
        )

async def add_bio(user_id: int,
                bio: str,
                db: AsyncSession) -> ResponseBio:
    try:
        user = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if user.bio:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail="Bio already exists"
            )
        user.bio = bio
        await db.commit()
        return ResponseBio(bio=user.bio)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("failed to add bio")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add bio"
        )
    

async def update_bio(user_id: int,
                bio: str,
                db: AsyncSession) -> ResponseBio:
    try:
        user = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if not user.bio:
            raise HTTPException(
                status_code = status.HTTP_400_BAD_REQUEST,
                detail="Bio not exists"
            )
        user.bio = bio
        await db.commit()
        return ResponseBio(bio=user.bio)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("failed to update bio")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bio"
        )
    

async def delete_bio(user_id: int,
                db: AsyncSession) -> DeleteBio:
    try:
        user = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        user = user.scalars().first()
        if not user:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if not user.bio:
            raise HTTPException(
                status_code = status.HTTP_400_BAD_REQUEST,
                detail="Bio not exists"
            )
        user.bio = None
        await db.commit()
        return DeleteBio(user_id=user_id)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("failed to delete bio")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete bio"
        )