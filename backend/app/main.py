from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .auth import router as auth_router
from .deps import get_current_user_id


Base.metadata.create_all(bind=engine)


app = FastAPI(title="AI Worker API", version="0.1.0")


# Allow local dev from Next.js
app.add_middleware(
CORSMiddleware,
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Example protected route
@app.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    return {"user_id": user_id}


app.include_router(auth_router)