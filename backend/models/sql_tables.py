from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base
from sqlalchemy import Index

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")

class Message(Base):
    __tablename__ = "messages" 
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String(1000), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    receiver_id = Column(Integer, ForeignKey("users.id"))
Index("idx_sender_receiver_time", Message.sender_id, Message.receiver_id, Message.timestamp)