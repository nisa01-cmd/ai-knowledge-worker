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
  try {
    const res = await api.post(
      `/worker/run?kind=stocks&symbol=${symbol}`,
      {},
      {
        auth: {
          username: "youremail@example.com",
          password: "yourpassword123",
        },
      }
    );

    const raw = res.data;
    const trend = raw.trend || [];

    const latest_price = trend.length ? trend[trend.length - 1].close : 0;
    const prev_price = trend.length > 1 ? trend[trend.length - 2].close : latest_price;
    const change_pct = prev_price ? ((latest_price - prev_price) / prev_price) * 100 : 0;

    return {
      symbol: raw.symbol || symbol,
      latest_price,
      change_pct: Math.round(change_pct * 100) / 100,
      trend: trend.map((d: any) => ({
        date: d.date,
        close: d.close,
        high: d.high,
        low: d.low,
        volume: d.volume,
      })),
    };
  } catch (err) {
    console.error("Error fetching stock:", err);
    throw err;
  }
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

