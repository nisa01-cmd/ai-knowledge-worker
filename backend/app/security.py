import os, datetime as dt
from jose import jwt
from passlib.context import CryptContext
from typing import Optional


JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_ctx.verify(password, hashed)


def create_access_token(sub: str, extra: Optional[dict] = None) -> str:
    to_encode = {"sub": sub, "exp": dt.datetime.utcnow() + dt.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    if extra:
        to_encode.update(extra)
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)