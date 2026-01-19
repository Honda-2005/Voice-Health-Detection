from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., alias="fullName")
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    terms_agree: bool = Field(..., alias="termsAgree")
    privacy_agree: bool = Field(..., alias="privacyAgree")
    data_consent: Optional[bool] = Field(False, alias="dataConsent")
    newsletter_opt_in: Optional[bool] = Field(False, alias="newsletterOptIn")
    created_at: Optional[str] = Field(datetime.utcnow().isoformat(), alias="createdAt")

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = Field(False, alias="rememberMe")

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime]
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    token: str
    expiresIn: int
    user: dict
