import os
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def gemini_chat(prompt: str, model: str = "gemini-1.5-pro-latest"):
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY is missing"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    body = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    res = requests.post(url, params={"key": GEMINI_API_KEY}, json=body)

    if res.status_code != 200:
        return {"error": res.json(), "status": res.status_code}

    data = res.json()

    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "No response")
    )

    return {"text": text}
