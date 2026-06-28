from sqlalchemy import select
from langchain_core.messages import HumanMessage

from app.models.sql_tables import User, Message
from app.bot.bot_agent import bot_agent
from app.chat import message_service as ms


async def find_bot_member(db, member_ids) -> int | None:
    if not member_ids:
        return None
    statement = await db.execute(
        select(User.id).where(User.id.in_(member_ids), User.role == "bot")
    )
    return statement.scalars().first()


async def get_bot_user_id(db) -> int | None:
    statement = await db.execute(select(User.id).where(User.role == "bot"))
    return statement.scalars().first()


async def run_agent(content, user_id) -> str:
    final_state = await bot_agent.ainvoke(
        {"messages": [HumanMessage(content=content)], "user_id": user_id}
    )
    return final_state["messages"][-1].content


async def generate_and_save_reply(db, conversation_id, bot_id, human_id, content) -> Message:
    reply_text = await run_agent(content, human_id)
    return await ms.save_message(db, conversation_id, bot_id, reply_text)
