from fastapi import FastAPI
from core.database import engine
from models.sql_tables import Base, User
from authentication.registration import router as registration_router
from app.connection import router as connection_router
from app.message import router as message_router
from app.person import router as user_router
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(registration_router)
app.include_router(connection_router)
app.include_router(message_router)
app.include_router(user_router) 

@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.username == "TexterBot"))
        if not result.scalars().first():
            bot = User(
                username="TexterBot",
                first_name="Texter",
                last_name="Bot",
                email="bot@texter.com",
                hashed_password="system_protected",
                role="bot"
            )
            session.add(bot)
            await session.commit()
    print("Database tables created successfully!")

@app.get("/")
async def read_root():
    return {"message": "Chat API is running and Database is connected!"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/clear-mysql")
async def clear_mysql():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    return {"message": "Database tables cleared successfully!"}
