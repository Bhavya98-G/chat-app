from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    email: EmailStr
    password: str = Field(min_length=8)

class RegistrationResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str | None = "bearer"
    role: str | None = "user"

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str | None = "bearer"

class LogoutRequest(BaseModel):
    refresh_token: str

class LogoutResponse(BaseModel):
    message: str

class GenerateOtpRequest(BaseModel):
    email: EmailStr

class GenerateOtpResponse(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: int
    new_password: str = Field(min_length=8)

class ResetPasswordResponse(BaseModel):
    message: str

class MeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str | None
    email: EmailStr
    role: str
    bio: str | None = None
    phone_number: str | None = None

    model_config = {"from_attributes": True}
