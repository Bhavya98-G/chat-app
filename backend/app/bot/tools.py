from langchain_core.tools import tool
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sql_tables import User, Message


@tool
async def get_history_with_contact(user_id: int, contact_username: str):
    """Fetch the chat history between the user and a specific contact by username."""
    async with AsyncSession(engine) as db:
        contact_res = await db.execute(select(User).where(User.username == contact_username))
        contact = contact_res.scalars().first()
        if not contact:
            return f"User {contact_username} not found."
        query = select(Message).where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == contact.id),
                and_(Message.sender_id == contact.id, Message.receiver_id == user_id)
            )
        ).order_by(Message.timestamp)
        result = await db.execute(query)
        messages = result.scalars().all()
        if not messages:
            return f"No messages found between {user_id} and {contact_username}."
        return [{"sender": m.sender_id, "content": m.content, "time": str(m.timestamp)} for m in messages]
        

        

@tool
async def get_message_to_user(content: str, target_username: str, sender_id: int):
    """Send a message to another user on behalf of the current user."""
    async with AsyncSession(engine) as db:
        target_res = await db.execute(select(User).where(User.username == target_username))
        target = target_res.scalars().first()
        if not target:
            return f"User {target_username} not found."
        new_msg = Message(sender_id=sender_id, receiver_id=target.id, content=content)
        db.add(new_msg)
        await db.commit()
        return f"Message sent to {target_username}."
        

