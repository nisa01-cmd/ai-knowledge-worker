from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .db import Base


class User(Base):
__tablename__ = "users"
id = Column(Integer, primary_key=True, index=True)
email = Column(String(255), unique=True, nullable=False, index=True)
name = Column(String(255), nullable=False)
password_hash = Column(String(255), nullable=False)
role = Column(String(50), default="user")
created_at = Column(DateTime(timezone=True), server_default=func.now())