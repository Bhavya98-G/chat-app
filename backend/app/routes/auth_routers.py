from fastapi import APIRouter, Depends
from app.auth.schemas import (
    UserCreate,
    RegistrationResponse,
    UserLogin,
    LoginResponse,
    GenerateOtpRequest,
    GenerateOtpResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutRequest,
    LogoutResponse,
)
from app.auth.services import (
    create_user,
    login_user,
    refresh_access_token,
    revoke_refresh_token,
)
from app.core.database import get_db, get_redis
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.forgot_password import send_otp, reset_user_password
import redis.asyncio as redis

router = APIRouter(tags=["auth"], prefix="/auth")


@router.post("/register", response_model=RegistrationResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    return await create_user(user, db)


@router.post("/login", response_model=LoginResponse)
async def login(
    user: UserLogin,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    return await login_user(user, db, redis_client)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_endpoint(
    body: RefreshRequest,
    redis_client: redis.Redis = Depends(get_redis),
):
    return await refresh_access_token(body.refresh_token, redis_client)


@router.post("/logout", response_model=LogoutResponse)
async def logout_endpoint(
    body: LogoutRequest,
    redis_client: redis.Redis = Depends(get_redis),
):
    await revoke_refresh_token(body.refresh_token, redis_client)
    return {"message": "Logged out"}


@router.post("/generate_otp", response_model=GenerateOtpResponse)
async def generate_otp_endpoint(
    body: GenerateOtpRequest,
    redis_client: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    return await send_otp(body.email, redis_client, db)


@router.post("/reset_password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(
    body: ResetPasswordRequest,
    redis_client: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    return await reset_user_password(body.email, body.otp, body.new_password, redis_client, db)
