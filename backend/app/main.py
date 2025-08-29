from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .auth import router as auth_router
from .deps import get_current_user_id
from .worker import router as worker_router
from dotenv import load_dotenv
import pandas as pd
import os, requests
import io

load_dotenv() 
app = FastAPI(title="AI Worker API", version="0.1.0")
app.include_router(worker_router)

# Allow local dev from Next.js
app.add_middleware(
CORSMiddleware,
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")

@app.get("/health")
def health():
    return {"status": "ok"}


# Example protected route
@app.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    return {"user_id": user_id}

from .connectors_router import router as connectors_router 

# Mount routers
app.include_router(auth_router)
app.include_router(worker_router)
app.include_router(connectors_router)   # <-- add this line

Base.metadata.create_all(bind=engine)

# -------- NEWSAPI --------
@app.get("/api/news")
def get_news(q: str = Query("artificial intelligence", alias="query")):
    url = f"https://newsapi.org/v2/everything?q={q}&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
    res = requests.get(url)
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="News API failed")
    return res.json()

# -------- STOCK API --------
@app.get("/api/stock/{symbol}")
def get_stock(symbol: str):
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
    res = requests.get(url)
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="Stock API failed")
    return res.json()

# -------- FILE UPLOAD --------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # --- Generate insights ---
        summary = {}
        summary["num_rows"] = len(df)
        summary["num_columns"] = len(df.columns)
        summary["columns"] = list(df.columns)

        # If there's a 'label' column, count occurrences
        if "label" in df.columns:
            summary["label_counts"] = df["label"].value_counts().to_dict()

        # If there's a 'url' column, show first 5 URLs
        if "url" in df.columns:
            summary["sample_urls"] = df["url"].head(5).tolist()

        return {
            "type": "csv",
            "summary": summary,
            "data_preview": df.head().to_dict()  # keep preview if needed
        }

    elif file.filename.endswith(".txt"):
        text = contents.decode("utf-8")
        summary = {"num_chars": len(text), "preview": text[:200]}
        return {"type": "txt", "summary": summary}

    elif file.filename.endswith(".pdf"):
        # Placeholder for PDF parsing
        return {"type": "pdf", "message": "PDF upload received"}
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")