import axios from "axios";

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Axios instance
const api = axios.create({ baseURL: BACKEND_URL });

// Attach token if exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Clear old token if missing/invalid
      localStorage.removeItem("token");
    }
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

export async function fetchStock(symbol: string, period = "6mo", interval = "1d") {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token — please login again.");

  const res = await api.post(
    "/worker/run",
    {},
    {
      params: { kind: "stocks", symbol, period, interval },
      headers: { Authorization: `Bearer ${token}` }, // ✅ force attach token
    }
  );

  const raw = res.data;

  return {
    symbol: raw.symbol || symbol,
    latest_price: raw.latest_price,
    change_pct: raw.change_pct,
    trend: (raw.trend || []).map((d: any) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    })),
  };
}
