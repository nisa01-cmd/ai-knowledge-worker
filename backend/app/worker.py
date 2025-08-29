from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import get_db
from .models import Task
from .config import NEWS_API_KEY, GEMINI_API_KEY, ALPHA_VANTAGE_API_KEY
from .schemas import TaskCreate, TaskOut, DocumentOut, InsightOut
from .deps import get_current_user_id
from .agent.orchestrator import run_task
import requests
import datetime

router = APIRouter(prefix="/worker", tags=["worker"])

# -------- Helpers -------- #
def fetch_news(query="AI", language="en"):
    url = f"https://newsapi.org/v2/everything?q={query}&language={language}&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json().get("articles", [])


def analyze_with_gemini(text: str):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}

    body = {
        "contents": [{"parts": [{"text": f"Summarize this news into key insights:\n{text}"}]}]
    }

    resp = requests.post(url, headers=headers, params=params, json=body)
    resp.raise_for_status()
    return resp.json()


def get_stock_data(symbol="AAPL"):
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()


# -------- Main Brain -------- #
@router.post("/run")
def run_worker(kind: str = "news", db: Session = Depends(get_db)):
    """
    kind = 'news' | 'stocks'
    """

    if kind == "news":
        articles = fetch_news("AI")
        if not articles:
            raise HTTPException(status_code=404, detail="No news found")

        # take first article for demo
        headline = articles[0]["title"]
        description = articles[0].get("description", "")

        gemini_summary = analyze_with_gemini(f"{headline}\n\n{description}")

        # extract Gemini text safely
        try:
            summary_text = gemini_summary["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            summary_text = "AI summary unavailable."

        # Save in DB as a Task
        task = Task(
            title=headline[:100],
            description=summary_text,
            status="completed",
            created_at=datetime.datetime.utcnow()
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        return {
            "source": "news",
            "headline": headline,
            "summary": summary_text,
            "task_id": task.id,
        }

    elif kind == "stocks":
        data = get_stock_data("AAPL")
        return {"source": "stocks", "data": data}

    else:
        raise HTTPException(status_code=400, detail="Unknown worker kind")
