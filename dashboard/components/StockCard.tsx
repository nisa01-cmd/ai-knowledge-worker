"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
  Rectangle,
} from "recharts";

type StockPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StockCardProps = {
  symbol: string;
};

// Custom candlestick shape
const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const fill = payload.close >= payload.open ? "#4caf50" : "#f44336"; // green/red
  const candleHeight = Math.max(1, Math.abs(payload.close - payload.open));
  const candleY = payload.close >= payload.open ? y + (height - candleHeight) : y;

  return <Rectangle x={x} y={candleY} width={width} height={candleHeight} fill={fill} />;
};

export default function StockCard({ symbol }: StockCardProps) {
  const [data, setData] = useState<StockPoint[]>([]);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [changePct, setChangePct] = useState<number | null>(null);

  useEffect(() => {
  async function fetchStock() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const apiUrl = `${backendUrl}/worker/run?kind=stocks&symbol=${symbol}`;
      
      // Get the token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      setData(json.trend || []);
      setLatestPrice(json.latest_price ?? null);
      setChangePct(json.change_pct ?? null);
    } catch (err) {
      console.error("Error fetching stock data:", err);
    }
  }

  fetchStock();
  const interval = setInterval(fetchStock, 60 * 1000);
  return () => clearInterval(interval);
}, [symbol]);

  const displayPrice = latestPrice !== null ? latestPrice.toFixed(2) : "--";
  const displayChange = changePct !== null ? changePct.toFixed(2) : "--";

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h2 className="font-bold text-lg">{symbol}</h2>
      <p
        className={`text-xl ${
          changePct !== null && changePct >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        ₹{displayPrice} ({displayChange}%)
      </p>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={20} />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            {/* Candlestick using Line + Customized Rectangle */}
            <Line type="monotone" dataKey="close" stroke="#000" dot={false} strokeWidth={0} />
            {data.map((entry, index) => (
              <Candlestick
                key={index}
                {...entry}
                x={index * 15}
                y={0}
                width={10}
                height={entry.high - entry.low}
                payload={entry}
              />
            ))}
            {/* Optional volume bars */}
            <Bar dataKey="volume" barSize={5} fill="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
