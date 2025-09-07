
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .db import get_db
from .models import Task
from .schemas import InsightOut
from .deps import get_current_user_id
from dotenv import load_dotenv
import os, datetime, logging
import httpx
import logging
import yfinance as yf

# ----------------- SETUP -----------------
router = APIRouter(prefix="/worker", tags=["worker"])
load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"

logging.basicConfig(level=logging.INFO)


# ----------------- HELPERS -----------------
async def fetch_news(query="AI", language="en", page_size=5):
    url = f"https://newsapi.org/v2/everything?q={query}&language={language}&sortBy=publishedAt&pageSize={page_size}&apiKey={NEWS_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
            res.raise_for_status()
            return res.json().get("articles", [])
    except httpx.RequestError as e:
        logging.error(f"News API request failed: {e}")
        raise HTTPException(status_code=503, detail="News API request failed")


async def analyze_with_gemini(text: str):
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    body = {
        "contents": [{"parts": [{"text": f"Summarize this news into key insights:\n{text}"}]}]
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(GEMINI_URL, headers=headers, params=params, json=body)
            res.raise_for_status()
            data = res.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                return "AI summary unavailable."
    except httpx.RequestError as e:
        logging.error(f"Gemini API request failed: {e}")
        return "AI summary unavailable."

async def get_stock_data(symbol: str = "RELIANCE.NS", interval: str = "1d", range_: str = "1y"):
    YAHOO_API_KEY = os.getenv("YAHOO_API_KEY")
    YAHOO_API_HOST = os.getenv("YAHOO_API_HOST")

    url = f"https://{YAHOO_API_HOST}/stock/v2/get-chart"
    params = {
        "symbol": symbol,
        "interval": interval,   # e.g. "1d", "1wk", "5m"
        "range": range_,        # e.g. "1mo", "3mo", "6mo", "1y", "5y"
        "region": "IN"
    }
    headers = {
        "X-RapidAPI-Key": YAHOO_API_KEY,
        "X-RapidAPI-Host": YAHOO_API_HOST
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        timestamps = data["chart"]["result"][0]["timestamp"]
        indicators = data["chart"]["result"][0]["indicators"]["quote"][0]

        series = []
        for i, ts in enumerate(timestamps):
            series.append({
                "date": datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
                "open": indicators["open"][i],
                "high": indicators["high"][i],
                "low": indicators["low"][i],
                "close": indicators["close"][i],
                "volume": indicators["volume"][i]
            })

        latest_price = series[-1]["close"]
        prev_price = series[-2]["close"] if len(series) > 1 else latest_price
        change_pct = ((latest_price - prev_price) / prev_price) * 100

        return {
            "symbol": symbol,
            "latest_price": round(latest_price, 2),
            "change_pct": round(change_pct, 2),
            "trend": series
        }

    except Exception as e:
        logging.error(f"Yahoo Finance RapidAPI error: {e}")
        raise HTTPException(status_code=503, detail="Yahoo Finance fetch error")

@router.post("/run", response_model=InsightOut)
async def run_worker(
    kind: str = Query("stocks", description="Type of worker: 'stocks' or 'news'"),
    symbol: str = Query("RELIANCE.NS", description="Stock symbol (Yahoo Finance)"),
    period: str = Query("6mo", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max)"),
    interval: str = Query("1d", description="Data interval (1m, 5m, 15m, 1d, 1wk, 1mo)"),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),  # <-- ensures token is valid
):
    """
    Run the AI worker.
    Requires a valid JWT in the Authorization header.
    Example: Authorization: Bearer <token>
    """

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: missing or invalid token"
        )

    if kind == "stocks":
        data = await get_stock_data(symbol, period, interval)
        return {
            "source": "stocks",
            "symbol": symbol,
            "latest_price": data["latest_price"],
            "change_pct": data["change_pct"],
            "trend": data["trend"],
            "user_id": user_id,  # <-- helpful for debugging
        }

    raise HTTPException(status_code=400, detail="Only stocks supported for now")
