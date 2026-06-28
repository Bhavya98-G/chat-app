from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
import phonenumbers

class CreateContact(BaseModel):
    contact_id : int
    nickname : str

class CreateContactResponse(BaseModel):
    contact_id : int
    nickname : str

class GetAllContact(BaseModel):
    contact_id : int
    nickname : str | None = None
    first_name : str
    last_name : str | None = None
    is_blocked : bool

class GetContact(BaseModel):
    nickname : str | None = None
    first_name : str
    last_name : str | None = None
    email : EmailStr
    phone_number : str | None = None
    bio : str | None = None
    created_at : datetime
    is_blocked : bool = False

class ChangeNickName(BaseModel):
    contact_id : int
    nickname : str | None = None

class BlockPerson(BaseModel):
    contact_id : int
    is_blocked : bool

class DeleteContact(BaseModel):
    contact_id : int

class RequestPhoneNumber(BaseModel):
    phone_number : str

class ResponsePhoneNumber(BaseModel):
    phone_number : str

class DeletePhoneNumber(BaseModel):
    user_id : int

class RequestBio(BaseModel):
    bio : str

class ResponseBio(BaseModel):
    bio : str

class DeleteBio(BaseModel):
    user_id : int
