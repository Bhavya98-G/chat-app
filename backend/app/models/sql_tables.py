from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone_number = Column(String(15), unique=True, nullable=True)
    bio = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Contact(Base):
    __tablename__ = "contact"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(50), nullable=True)
    is_blocked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("owner_id", "contact_id", name="uq_contact_owner_contact"),
        CheckConstraint("owner_id <> contact_id", name="ck_contact_not_self"),
    )


class Conversation(Base):
    __tablename__ = "conversation"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), default="direct", nullable=False)
    name = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        CheckConstraint("type IN ('direct', 'group')", name="ck_conversation_type"),
    )


class ConversationMember(Base):
    __tablename__ = "conversation_member"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), default="member", nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_read_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_member_conversation_user"),
    )


class Message(Base):
    __tablename__ = "message"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(20), default="text", nullable=False)
    content = Column(Text, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_message_conversation_created", "conversation_id", "created_at"),
        CheckConstraint("type IN ('text', 'image', 'video', 'file', 'audio')", name="ck_message_type"),
    )


class MessageStatus(Base):
    __tablename__ = "msg_status"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("message.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="unread", nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_status_message_user"),
        CheckConstraint("status IN ('unread', 'delivered', 'read')", name="ck_message_status"),
        Index("idx_status_user_status", "user_id", "status"),
    )


class FileLocation(Base):
    __tablename__ = "file_location"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("message.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(512), nullable=False)
    type = Column(String(50), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
