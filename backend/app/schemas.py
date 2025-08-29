from pydantic import BaseModel, EmailStr, Field, AnyUrl
from typing import Optional, List, Dict, Any

class RegisterIn(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class DocumentIn(BaseModel):
    source: str                      # 'news'|'url'|'upload'
    title: Optional[str] = None
    url: Optional[str] = None
    content: str
    meta: Optional[Dict[str, Any]] = None

class DocumentOut(DocumentIn):
    id: int
    class Config: orm_mode = True

class InsightOut(BaseModel):
    id: int
    document_id: Optional[int] = None
    summary: str
    topics: Optional[List[str]] = None
    sentiment: Optional[str] = None
    class Config: orm_mode = True

class TaskCreate(BaseModel):
    kind: str                        # 'news'|'url'|'file'
    query: Optional[str] = None      # for news
    url: Optional[AnyUrl] = None     # for url
    file_id: Optional[int] = None    # if you later add file uploads

class TaskOut(BaseModel):
    id: int
    kind: str
    status: str
    result: Optional[Dict[str, Any]] = None
    class Config: orm_mode = True

class GeminiPrompt(BaseModel):
    prompt: str        