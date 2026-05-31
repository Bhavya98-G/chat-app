import asyncio
import logging
import uuid
import bcrypt
import redis.asyncio as redis
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import get_db
from app.auth.schemas import UserCreate, UserLogin, RegistrationResponse
from app.models.sql_tables import User

settings = get_settings()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None or payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


async def authenticate_websocket(token: str, db: AsyncSession) -> User | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalars().first()

async def hash_password(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def create_refresh_token(user_id: int, redis_client: redis.Redis) -> str:
    jti = uuid.uuid4().hex
    ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    expire = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    payload = {
        "sub": str(user_id),
        "jti": jti,
        "type": "refresh",
        "exp": expire,
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    await redis_client.set(f"refresh:{jti}", str(user_id), ex=ttl_seconds)
    return token


async def refresh_access_token(refresh_token: str, redis_client: redis.Redis) -> dict:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise invalid

    if payload.get("type") != "refresh":
        raise invalid
    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        raise invalid

    stored = await redis_client.get(f"refresh:{jti}")
    if stored is None:
        raise invalid

    await redis_client.delete(f"refresh:{jti}")
    new_access = await create_access_token({"sub": str(user_id)})
    new_refresh = await create_refresh_token(int(user_id), redis_client)
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


async def revoke_refresh_token(refresh_token: str, redis_client: redis.Redis) -> None:
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return
    jti = payload.get("jti")
    if jti:
        await redis_client.delete(f"refresh:{jti}")

async def create_user(user: UserCreate, db: AsyncSession):
    try:
        result = await db.execute(select(User).where(User.email == user.email))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
        hashed_password =await hash_password(user.password)
        new_user = User(first_name=user.first_name,last_name=user.last_name,email=user.email, hashed_password=hashed_password)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return RegistrationResponse(id=new_user.id,email=new_user.email,created_at=new_user.created_at)
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        logger.exception("create_user failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed")

async def login_user(user: UserLogin, db: AsyncSession, redis_client: redis.Redis):
    try:
        result = await db.execute(select(User).where(User.email == user.email))
        existing_user = result.scalars().first()
        if not existing_user or not await verify_password(user.password, existing_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        access_token = await create_access_token(data={"sub": str(existing_user.id), "role": existing_user.role})
        refresh_token = await create_refresh_token(existing_user.id, redis_client)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": existing_user.role,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("login_user failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed")