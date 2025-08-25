from fastapi import Header, HTTPException
from jose import jwt, JWTError
import os
from typing import Optional


JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALG = os.getenv("JWT_ALG", "HS256")


def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return int(payload["sub"]) # user id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")