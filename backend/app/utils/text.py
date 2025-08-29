import os, re
from typing import List, Dict
import math

# Optional OpenAI; fall back to stub summarizer
_OPENAI = None
try:
    import openai  # type: ignore
    if os.getenv("OPENAI_API_KEY"):
        openai.api_key = os.getenv("OPENAI_API_KEY")
        _OPENAI = openai
except Exception:
    _OPENAI = None

def _split_sentences(text: str) -> List[str]:
    return re.split(r'(?<=[.!?])\s+', text.strip())

def simple_extractive_summary(text: str, max_sentences: int = 5) -> str:
    # naive frequency-based summary for offline use
    sentences = _split_sentences(text)
    if len(sentences) <= max_sentences:
        return text.strip()
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    freq = {}
    for w in words: freq[w] = freq.get(w, 0) + 1
    score = []
    for s in sentences:
        sw = re.findall(r"\b[a-zA-Z]{4,}\b", s.lower())
        sc = sum(freq.get(w, 0) for w in sw) / (len(sw) + 1e-6)
        score.append((sc, s))
    top = [s for _, s in sorted(score, key=lambda x: x[0], reverse=True)[:max_sentences]]
    return " ".join(top)

def summarize(text: str) -> str:
    if _OPENAI:
        try:
            resp = _OPENAI.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role":"system","content":"You concisely summarize text for busy analysts."},
                    {"role":"user","content":f"Summarize in 5-7 bullet points:\n\n{text[:12000]}"},
                ],
                temperature=0.2,
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            pass
    return simple_extractive_summary(text, max_sentences=6)

def extract_topics(text: str, k: int = 5) -> List[str]:
    # very small heuristic topic extractor
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    stop = set("with this that from into about were have which their there would shall could should might your just when will them they been being because other every those where while whose meanwhile among after before above below".split())
    freq = {}
    for w in words:
        if w in stop: continue
        freq[w] = freq.get(w, 0) + 1
    topics = [w for w,_ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:k]]
    return topics

def simple_sentiment(text: str) -> str:
    pos = len(re.findall(r"\b(good|great|gain|up|positive|success|improve|beat)\b", text.lower()))
    neg = len(re.findall(r"\b(bad|fall|down|loss|negative|miss|risk|issue|decline)\b", text.lower()))
    if abs(pos-neg) <= 1: return "neutral"
    return "positive" if pos > neg else "negative"
