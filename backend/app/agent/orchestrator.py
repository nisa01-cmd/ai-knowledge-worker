from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from ..models import Document, Insight, Task
from ..utils.text import summarize, extract_topics, simple_sentiment
from ..connectors.newsapi import fetch_news

def _store_doc(db: Session, user_id: Optional[int], payload: Dict[str, Any]) -> Document:
    doc = Document(
        user_id=user_id,
        source=payload["source"],
        title=payload.get("title"),
        url=payload.get("url"),
        content=payload["content"],
        meta=payload.get("meta"),
    )
    db.add(doc); db.commit(); db.refresh(doc)
    return doc

def _analyze_doc(db: Session, user_id: Optional[int], doc: Document) -> Insight:
    summary = summarize(doc.content)
    topics  = extract_topics(doc.content, k=5)
    senti   = simple_sentiment(doc.content)
    ins = Insight(user_id=user_id, document_id=doc.id, summary=summary, topics=topics, sentiment=senti)
    db.add(ins); db.commit(); db.refresh(ins)
    return ins

def run_task(db: Session, task: Task, user_id: Optional[int] = None) -> Task:
    task.status = "running"; db.commit()
    try:
        results: List[Dict[str, Any]] = []
        if task.kind == "news":
            query = (task.input or {}).get("query", "technology")
            articles = fetch_news(query=query)  # can be empty without key
            for a in articles:
                a["source"] = "news"
                doc = _store_doc(db, user_id, a)
                ins = _analyze_doc(db, user_id, doc)
                results.append({"document_id": doc.id, "insight_id": ins.id})
        elif task.kind == "url":
            import requests, bs4
            url = (task.input or {}).get("url")
            html = requests.get(url, timeout=20).text
            soup = bs4.BeautifulSoup(html, "html.parser")
            text = " ".join([t.get_text(" ", strip=True) for t in soup.select("p")])[:20000]
            doc = _store_doc(db, user_id, {"source":"url","title":soup.title.string if soup.title else url,"url":url,"content":text})
            ins = _analyze_doc(db, user_id, doc)
            results.append({"document_id": doc.id, "insight_id": ins.id})
        else:
            raise ValueError(f"Unknown task kind: {task.kind}")

        task.status = "done"; task.result = {"items": results}; db.commit()
    except Exception as e:
        task.status = "error"; task.result = {"error": str(e)}; db.commit()
    return task
