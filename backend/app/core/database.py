from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import redis.asyncio as redis
import os
from app.core.config import get_settings

settings = get_settings()
DATABASE_URL = f"mysql+aiomysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"

engine = create_async_engine(
    DATABASE_URL,
    echo=True,             # set False in production
    future=True,
    pool_pre_ping=True
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)



async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# Redis
redis_pool = redis.ConnectionPool(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
redis_client = redis.Redis(connection_pool=redis_pool)

async def get_redis():
    return redis_client