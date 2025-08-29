from fastapi import APIRouter, Query, HTTPException
from .connectors.newsapi import fetch_news
from .connectors.alphavantage import fetch_stock
from .connectors.gemini import gemini_chat
from .schemas import GeminiPrompt  # <-- use the one from schemas.py
from pydantic import BaseModel
import os, requests

router = APIRouter(prefix="/api", tags=["connectors"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@router.get("/news")
def get_news(query: str = Query("AI")):
    try:
        return fetch_news(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        return fetch_stock(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GeminiPrompt(BaseModel):
    prompt: str
    model: str = "gemini-1.5-pro-latest"
    
@router.post("/gemini")
def chat_with_gemini(body: GeminiPrompt):
    try:
        response = gemini_chat(body.prompt, body.model)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gemini/models")
def list_models():
    url = "https://generativelanguage.googleapis.com/v1beta/models"
    res = requests.get(url, params={"key": GEMINI_API_KEY})
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.json())
    return res.json()