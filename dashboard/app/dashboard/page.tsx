"use client";

import { useEffect, useState } from "react";
import { motion, Reorder } from "framer-motion";

import Sidebar from "../../components/Sidebar";
import ChartCard from "../../components/ChartCard";
import StockCard from "../../components/StockCard";
import GeminiInsightsCard from "../../components/GeminiInsightsCard";
import LatestNewsCard from "../../components/LatestNewsCard";
import ManualUploadCard from "../../components/ManualUploadCard";

import { fetchNews, fetchStock, chatWithGemini, uploadFile } from "../../lib/api";

// ----- Stock type -----
interface StockData {
  symbol: string;
  latest_price: number;
  change_pct: number;
  trend: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export default function Dashboard() {
  const [news, setNews] = useState<any[]>([]);
  const [stock, setStock] = useState<StockData | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>("Loading...");
  const [geminiError, setGeminiError] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<any>(null);

  // For draggable order
  const [cards, setCards] = useState([
    "chart",
    "stock",
    "gemini",
    "news",
    "upload",
  ]);

  useEffect(() => {
    fetchNews().then((data) => setNews(data.articles || []));
    fetchStock("RELIANCE.NS").then((data) => {
      setStock({
        symbol: data.symbol,
        latest_price: data.latest_price,
        change_pct: data.change_pct,
        trend: data.trend,
      });
    });

    chatWithGemini("Summarize AI news today")
      .then((data) => {
        if (data.error) setGeminiError(JSON.stringify(data.error));
        else setGeminiResponse(data.text || "No response");
      })
      .catch(() => setGeminiError("Failed to fetch Gemini response"));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const result = await uploadFile(file);
    setUploadResult(result);
  };

  const cardWrapperClass =
    "bg-white p-4 rounded-2xl shadow-md h-full flex flex-col transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl";

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <motion.main
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">📊 AI Worker Dashboard</h2>
        </div>

        {/* Draggable grid */}
        <Reorder.Group
          axis="y"
          values={cards}
          onReorder={setCards}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {cards.map((card) => (
            <Reorder.Item key={card} value={card}>
              {card === "chart" && (
                <div className={cardWrapperClass}>
                  <ChartCard />
                </div>
              )}
              {card === "stock" && stock && (
                <div className={cardWrapperClass}>
                  <StockCard symbol={stock.symbol} />
                </div>
              )}
              {card === "gemini" && (
                <div className={cardWrapperClass}>
                  <GeminiInsightsCard
                    response={geminiResponse}
                    error={geminiError}
                  />
                </div>
              )}
              {card === "news" && (
                <div className={cardWrapperClass}>
                  <LatestNewsCard news={news} />
                </div>
              )}
              {card === "upload" && (
                <div className={`${cardWrapperClass} md:col-span-2 lg:col-span-2`}>
                  <ManualUploadCard
                    onUpload={handleUpload}
                    uploadResult={uploadResult}
                  />
                </div>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.main>
    </div>
  );
}
