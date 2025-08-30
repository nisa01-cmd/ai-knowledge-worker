"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchTrends } from "../lib/api";

type Point = { name: string; value: number; rawDate: string };

function formatLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
  });
}

export default function ChartCard() {
  const [days, setDays] = useState<number>(7);
  const [query, setQuery] = useState<string>("artificial intelligence");
  const [data, setData] = useState<Point[]>([]);
  const [meta, setMeta] = useState<{ totalArticles: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchTrends({ days, query });
      const points: Point[] = res.series.map((s) => ({
        name: formatLabel(s.date),
        value: s.count,
        rawDate: s.date,
      }));
      setData(points);
      setMeta({ totalArticles: res.meta.totalArticles });
    } catch (e: any) {
      setError("Failed to load trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [days, query]);

  const maxY = useMemo(() => Math.max(5, ...data.map((d) => d.value)), [data]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Weekly AI News Trends
        </h3>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keyword (e.g., Nvidia)"
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={load}
            className="rounded-lg px-4 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[220px] flex items-center justify-center">
        {loading ? (
          <span className="text-gray-500 italic">Loading…</span>
        ) : error ? (
          <span className="text-red-600 font-medium">{error}</span>
        ) : data.length === 0 ? (
          <span className="text-gray-400 italic">No data available</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[0, maxY]}
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  borderColor: "#d1d5db",
                  fontSize: "13px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb" }}
                activeDot={{ r: 6, fill: "#1d4ed8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      {meta && (
        <div className="text-sm text-gray-600 text-center sm:text-left">
          <span className="font-semibold">{meta.totalArticles}</span> articles
          in the last <span className="font-semibold">{days} days</span> for “
          {query}”.
        </div>
      )}
    </div>
  );
}
