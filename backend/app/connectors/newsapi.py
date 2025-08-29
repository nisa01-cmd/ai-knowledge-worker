import os, requests
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def fetch_news(query: str = "technology", page_size: int = 5):
    if not NEWS_API_KEY:
        return []
    url = "https://newsapi.org/v2/everything"
    params = {"q": query, "pageSize": page_size, "sortBy": "publishedAt", "language": "en", "apiKey": NEWS_API_KEY}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    articles = r.json().get("articles", [])
    out = []
    for a in articles:
        out.append({
            "title": a.get("title"),
            "url": a.get("url"),
            "content": (a.get("description") or "") + "\n" + (a.get("content") or ""),
            "meta": {"source": a.get("source",{}).get("name"), "publishedAt": a.get("publishedAt")}
        })
    return out
