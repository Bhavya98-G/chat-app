import asyncio
import logging
import random
import redis.asyncio as redis
from app.core.database import get_redis
import smtplib
from email.mime.text import MIMEText
from app.models.sql_tables import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.services import hash_password
from app.core.config import get_settings
from fastapi import HTTPException, status

settings = get_settings()
logger = logging.getLogger(__name__)

async def get_user_by_email(email, db):
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalars().first()
    return existing_user

def generate_otp_code():
    return random.randint(100000, 999999)

async def store_otp(email, otp, redis_client):
    await redis_client.set(f"otp:{email}", otp, ex=300)

def _send_email_otp_sync(email: str, otp: int) -> None:
    msg = MIMEText(f"Your OTP is {otp}")
    msg['Subject'] = "OTP Verification"
    msg['From'] = settings.SMTP_USERNAME
    msg['To'] = email

    with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(msg['From'], [msg['To']], msg.as_string())


async def send_email_otp(email: str, otp: int) -> None:
    await asyncio.to_thread(_send_email_otp_sync, email, otp)

OTP_COOLDOWN_SECONDS = 60

async def send_otp(email: str, redis_client: redis.Redis, db: AsyncSession):
    cooldown_claimed = await redis_client.set(
        f"otp_cooldown:{email}", "1", ex=OTP_COOLDOWN_SECONDS, nx=True
    )
    if not cooldown_claimed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another OTP",
        )

    user = await get_user_by_email(email, db)
    if user:
        otp = generate_otp_code()
        await store_otp(email, otp, redis_client)
        try:
            await send_email_otp(email, otp)
        except Exception:
            logger.exception("send_email_otp failed for %s", email)

    return {"email": email}

MAX_OTP_ATTEMPTS = 5

async def verify_otp(email: str, otp: int, redis_client: redis.Redis):
    otp_key = f"otp:{email}"
    attempts_key = f"otp_attempts:{email}"

    stored_otp = await redis_client.get(otp_key)
    if not stored_otp:
        return False

    if int(stored_otp) == otp:
        await redis_client.delete(otp_key, attempts_key)
        return True

    attempts = await redis_client.incr(attempts_key)
    if attempts == 1:
        await redis_client.expire(attempts_key, 300)
    if attempts >= MAX_OTP_ATTEMPTS:
        await redis_client.delete(otp_key, attempts_key)
    return False

async def update_password(email, password, db):
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalars().first()
    existing_user.hashed_password = await hash_password(password)
    await db.commit()
    await db.refresh(existing_user)
    return existing_user

async def reset_user_password(email: str, otp: int, password: str, redis_client: redis.Redis, db: AsyncSession):
    if await verify_otp(email, otp, redis_client):
        await update_password(email, password, db)
        return {"message": "Password reset successfully"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
