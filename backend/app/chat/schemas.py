from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional

class WSMessageIn(BaseModel):
    type : Literal["message"]
    conversation_id : int
    content : str

class WSTypingIn(BaseModel):
    type : Literal["typing"]
    conversation_id: int
    is_typing : bool

class WSReadIn(BaseModel):
    type: Literal["read"]
    conversation_id: int

class CreateConversation(BaseModel):
    peer_id : int

class ConversationOut(BaseModel):
    conversation_id : int

class MessageOut(BaseModel):
    id : int
    conversation_id : int
    sender_id : Optional[int]
    content : str
    created_at : datetime

    model_config = {"from_attributes": True}

class UserOut(BaseModel):
    id : int
    first_name : str
    last_name : Optional[str] = None
    email : str

    model_config = {"from_attributes": True}
