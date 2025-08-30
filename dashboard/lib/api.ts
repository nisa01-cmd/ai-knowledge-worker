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
export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  const token = res.data?.access_token;
  if (token) {
    localStorage.setItem("access_token", token);
    // also set default for this tab’s axios instance
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
  return res.data?.user;
}


export async function fetchNews() {
  const res = await api.get("/api/news");
  return res.data; // returns { articles: [...] }
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

export async function fetchTrends(params?: { days?: number; query?: string }) {
  const res = await api.get("/api/trends", { params });
  return res.data as {
    series: { date: string; count: number }[];
    meta: { query: string; days: number; totalArticles: number; generatedAt: string };
  };
}

export async function fetchInsights() {
  const res = await api.get("/api/insights/daily");
  return res.data;
}

export async function fetchStock(symbol: string) {
  const res = await api.post(`/worker/run?kind=stocks&symbol=${symbol}`, {});
  const raw = res.data;
  const trend = raw.trend || [];
  const latest = trend.length ? trend[trend.length - 1].close : 0;
  const prev = trend.length > 1 ? trend[trend.length - 2].close : latest;
  const change_pct = prev ? ((latest - prev) / prev) * 100 : 0;

  return {
    symbol: raw.symbol || symbol,
    latest_price: latest,
    change_pct: Math.round(change_pct * 100) / 100,
    trend: trend.map((d: any) => ({
      date: d.date, close: d.close, high: d.high, low: d.low, volume: d.volume,
    })),
  };
}
