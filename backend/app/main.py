# main.py
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.logger import logger
from .db import Base, engine
from .auth import router as auth_router
from .worker import router as worker_router
from .connectors_router import router as connectors_router
from .deps import get_current_user_id
from dotenv import load_dotenv
import pandas as pd
import os, requests, io, hashlib, time
from datetime import datetime, timedelta, timezone
from collections import Counter
from PyPDF2 import PdfReader
import httpx
import logging

# ----------------- SETUP -----------------
load_dotenv()

app = FastAPI(title="AI Worker API", version="0.1.0")

# Routers
app.include_router(auth_router)
app.include_router(worker_router)
app.include_router(connectors_router)

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database tables
Base.metadata.create_all(bind=engine)

# API keys
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")
GEMINI_API = os.getenv("GEMINI_API_URL", "http://127.0.0.1:8000/api/gemini")

# In-memory cache
_TREND_CACHE = {}
_TREND_TTL_SECONDS = 300  # 5 minutes

# Configure logging
logging.basicConfig(level=logging.INFO)


# ----------------- UTILITY -----------------
def _cache_get(key: str):
    item = _TREND_CACHE.get(key)
    if not item:
        return None
    if time.time() > item["exp"]:
        _TREND_CACHE.pop(key, None)
        return None
    return item["data"]


def _cache_set(key: str, data):
    _TREND_CACHE[key] = {"data": data, "exp": time.time() + _TREND_TTL_SECONDS}


async def call_gemini(prompt: str, timeout: int = 10):
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(GEMINI_API, json={"prompt": prompt})
            res.raise_for_status()
            return res.json().get("text", "No insights available")
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return "No insights available"


# ----------------- HEALTH -----------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    return {"user_id": user_id}


# ----------------- NEWS API -----------------
@app.get("/api/news/latest")
def get_latest_news():
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="Missing NEWS_API_KEY")
    url = f"https://newsapi.org/v2/everything?q=artificial+intelligence&sortBy=publishedAt&pageSize=10&apiKey={NEWS_API_KEY}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
    except Exception as e:
        logger.error(f"News API error: {e}")
        raise HTTPException(status_code=500, detail="News API failed")

    data = res.json()
    articles = data.get("articles", [])
    formatted = [
        {
            "title": a.get("title"),
            "url": a.get("url"),
            "source": a.get("source", {}).get("name", "Unknown"),
            "publishedAt": a.get("publishedAt"),
        }
        for a in articles
    ]
    return formatted


# ----------------- STOCK API -----------------
@app.get("/api/stock/{symbol}")
def get_stock(symbol: str):
    if not ALPHA_VANTAGE_KEY:
        raise HTTPException(status_code=500, detail="Missing ALPHA_VANTAGE_KEY")
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        raw = res.json()
    except Exception as e:
        logger.error(f"Stock API error: {e}")
        raise HTTPException(status_code=500, detail="Stock API failed")

    if "Time Series (Daily)" not in raw:
        raise HTTPException(status_code=500, detail="Invalid AlphaVantage response")

    series = raw["Time Series (Daily)"]
    parsed = []
    for date_str, vals in list(series.items())[:7]:
        parsed.append({
            "date": datetime.strptime(date_str, "%Y-%m-%d").strftime("%b %d"),
            "open": float(vals["1. open"]),
            "high": float(vals["2. high"]),
            "low": float(vals["3. low"]),
            "close": float(vals["4. close"]),
            "volume": int(vals["5. volume"])
        })
    parsed.reverse()
    latest = parsed[-1]
    prev = parsed[-2] if len(parsed) > 1 else None
    change_pct = ((latest["close"] - prev["close"]) / prev["close"] * 100) if prev else 0

    return {
        "symbol": symbol.upper(),
        "latest_price": latest["close"],
        "change_pct": round(change_pct, 2),
        "trend": parsed
    }


# ----------------- FILE UPLOAD -----------------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename.lower()

    # ---------- CSV ----------
    if filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
            preview = df.head().to_dict()
            insights = await call_gemini(f"Analyze this dataset:\n{df.head(20).to_csv(index=False)}")
            return {
                "type": "csv",
                "preview": preview,
                "rows": len(df),
                "columns": list(df.columns),
                "ai_insights": insights
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parsing failed: {str(e)}")

    # ---------- TXT ----------
    elif filename.endswith(".txt"):
        text = contents.decode("utf-8")
        preview = text[:500]
        insights = await call_gemini(f"Summarize and extract insights from this text:\n{preview}")
        return {"type": "txt", "preview": preview, "ai_insights": insights}

    # ---------- PDF ----------
    elif filename.endswith(".pdf"):
        try:
            pdf = PdfReader(io.BytesIO(contents))
            text = ""
            for page in pdf.pages[:3]:
                text += page.extract_text() + "\n"
            insights = await call_gemini(f"Summarize and extract insights from this PDF:\n{text[:2000]}")
            return {"type": "pdf", "preview": text[:500], "ai_insights": insights}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parsing failed: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")


# ----------------- AI Weekly Trends -----------------
@app.get("/api/trends")
def get_ai_trends(
    query: str = Query("artificial intelligence", alias="query"),
    days: int = Query(7, ge=1, le=30),
    page_size: int = Query(100, ge=20, le=100),
):
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="Missing NEWS_API_KEY")

    ck = hashlib.sha1(f"{query}:{days}:{page_size}".encode()).hexdigest()
    cached = _cache_get(ck)
    if cached:
        return cached

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    url = (
        "https://newsapi.org/v2/everything"
        f"?q={requests.utils.quote(query)}"
        f"&from={since.isoformat(timespec='seconds').replace('+00:00','Z')}"
        f"&to={now.isoformat(timespec='seconds').replace('+00:00','Z')}"
        f"&sortBy=publishedAt&language=en&pageSize={page_size}&apiKey={NEWS_API_KEY}"
    )
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        body = res.json()
    except Exception as e:
        logger.error(f"News API error: {e}")
        if cached:
            return cached
        raise HTTPException(status_code=500, detail="News API failed")

    if body.get("status") != "ok":
        if cached:
            return cached
        raise HTTPException(status_code=500, detail=body.get("message", "News API error"))

    articles = body.get("articles", [])
    counts = Counter()
    for art in articles:
        ts = art.get("publishedAt")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                counts[dt.date().isoformat()] += 1
            except Exception:
                continue

    series = [{"date": (since + timedelta(days=i+1)).date().isoformat(), "count": counts.get((since + timedelta(days=i+1)).date().isoformat(), 0)} for i in range(days)]

    payload = {
        "series": series,
        "meta": {
            "query": query,
            "days": days,
            "totalArticles": sum(c["count"] for c in series),
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "note": "Cached for 5 minutes to respect rate limits."
        }
    }
    _cache_set(ck, payload)
    return payload


# ----------------- DAILY INSIGHTS -----------------
@app.get("/api/insights/daily")
async def get_daily_insights():
    # Example: fetch top news, generate summaries with Gemini
    prompt = "Fetch top AI news for today and summarize key themes."
    summary = await call_gemini(prompt)
    return {"date": datetime.utcnow().date().isoformat(), "themes": summary}
