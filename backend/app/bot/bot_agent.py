import os
from typing import TypedDict, Annotated, List

from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from .tools import get_chat_history


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    user_id: int


SYSTEM_PROMPT = (
    "You are Texter Bot, a friendly assistant living inside a chat app. "
    "Keep replies short and conversational. "
    "When the user asks what they talked about with someone, use the "
    "get_chat_history tool to look it up. For anything else, just answer normally."
)

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    api_key=os.getenv("GROQ_API_KEY"),
)

tools = [get_chat_history]
llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools)


async def call_model(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]]
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")

bot_agent = workflow.compile()
