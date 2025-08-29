import axios from "axios";

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Axios instance
const api = axios.create({ baseURL: BACKEND_URL });

// Attach token if exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- API helpers ----------

export async function fetchNews() {
  const res = await api.get("/api/news");
  return res.data; // returns { articles: [...] }
}

export async function fetchStock(symbol: string) {
  const res = await api.get(`/api/stock/${symbol}`);
  return res.data; // returns stock JSON
}

export async function chatWithGemini(prompt: string) {
  const res = await api.post("/api/gemini", { prompt });
  return res.data; // { text: "..." }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // returns upload result
}
