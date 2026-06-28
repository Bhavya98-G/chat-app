from fastapi import FastAPI
from app.core.database import engine
from app.models.sql_tables import Base, User
from app.routes.auth_routers import router as auth_router
from app.routes.general_route import router as genral_router
from app.routes.chat_ws import router as chat_ws_router
from app.routes.chat_rest import router as chat_rest_router
from app.routes.admin_route import router as admin_router
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

app.include_router(auth_router)
app.include_router(genral_router)
app.include_router(admin_router)
app.include_router(chat_rest_router)
app.include_router(chat_ws_router)

@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == "bot@texter.com", User.role == "bot"))
        if not result.scalars().first():
            bot = User(
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


