import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from functools import lru_cache
load_dotenv()

class Settings(BaseSettings):

    #Auth
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    MAX_REQUESTS_PER_WINDOW: int = 1000
    ADMIN_KEY: int = 555555

    #MySQL
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = str(os.getenv("MYSQL_PASSWORD", ""))
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3311
    MYSQL_DATABASE: str ="chat_app"
    
    #Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
 
    # Gmail Smtp
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "bhavyagarg005@gmail.com"
    SMTP_PASSWORD: str = str(os.getenv("SMTP_PASSWORD", ""))
    
@lru_cache
def get_settings() -> Settings:
    return Settings()