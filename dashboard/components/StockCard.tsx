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
import { fetchStock } from "../lib/api"; // Import your API helper

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

// ✅ Proper candlestick shape
const Candlestick = (props: any) => {
  const { x, width, payload } = props;
  const open = payload.open;
  const close = payload.close;
  const high = payload.high;
  const low = payload.low;

  const color = close >= open ? "#4caf50" : "#f44336"; // green/red

  // Candle body
  const candleY = close >= open ? close : open;
  const candleHeight = Math.max(1, Math.abs(open - close));

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        x2={x + width / 2}
        y1={high}
        y2={low}
        stroke={color}
      />
      {/* Body */}
      <Rectangle
        x={x}
        y={candleY}
        width={width}
        height={candleHeight}
        fill={color}
      />
    </g>
  );
};

export default function StockCard({ symbol }: StockCardProps) {
  const [data, setData] = useState<StockPoint[]>([]);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [changePct, setChangePct] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStockData() {
      try {
        setLoading(true);
        setError(null);
        const stockData = await fetchStock(symbol);
        setData(stockData.trend || []);
        setLatestPrice(stockData.latest_price);
        setChangePct(stockData.change_pct);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data");
        setData([]);
        setLatestPrice(null);
        setChangePct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStockData();
    const interval = setInterval(fetchStockData, 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  const displayPrice = latestPrice !== null ? latestPrice.toFixed(2) : "--";
  const displayChange = changePct !== null ? changePct.toFixed(2) : "--";

  if (loading) {
    return (
      <div className="p-4 border rounded shadow bg-white">
        <h2 className="font-bold text-lg">{symbol}</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded shadow bg-white">
        <h2 className="font-bold text-lg">{symbol}</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h2 className="font-bold text-lg">{symbol}</h2>
      <p
        className={`text-xl ${
          changePct !== null && changePct >= 0
            ? "text-green-600"
            : "text-red-600"
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
            {/* ✅ Candlestick */}
            <Bar
              dataKey="close"
              fill="#000000"
              shape={<Candlestick />}
              barSize={6}
            />
            {/* ✅ Volume */}
            <Bar
              dataKey="volume"
              barSize={2}
              fill="#8884d8"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
