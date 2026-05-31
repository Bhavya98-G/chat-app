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
    nickname : str

class GetContact(BaseModel):
    nickname : str | None
    first_name : str
    last_name : str | None
    email: EmailStr
    phone_number : str | None
    bio : str | None
    created_at : datetime

class ChangeNickName(BaseModel):
    contact_id : int
    nickname : str

class BlockPerson(BaseModel):
    contact_id : int
    is_blocked : bool

class DeleteContact(BaseModel):
    contact_id : int

class RequestPhoneNumber(BaseModel):
    phone_number : str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        try:
            parsed = phonenumbers.parse(v, None)
        except phonenumbers.NumberParseException:
            raise ValueError("Invalid phone numer") 
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Invalid phone number")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

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

    

    