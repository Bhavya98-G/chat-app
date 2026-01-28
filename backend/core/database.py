from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import os

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+aiomysql://dev_user:dev_password@localhost:3311/chat_app")

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
