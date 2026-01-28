from langchain_groq import ChatGroq
from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, START,END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage 
from .tools import get_history_with_contact, get_message_to_user
import os


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    user_id: int
    target_contact_id: int = None

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    api_key=os.getenv("GROQ_API_KEY")
)

tools = [get_history_with_contact, get_message_to_user]
llm_with_tools = llm.bind_tools(tools)

def call_model(state: AgentState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)

workflow.add_edge(START, "agent")
bot_agent = workflow.compile()