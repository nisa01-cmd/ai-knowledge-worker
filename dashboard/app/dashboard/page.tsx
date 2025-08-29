"use client";
import { motion } from "framer-motion";
import Sidebar from "../../components/Sidebar";
import ChartCard from "../../components/ChartCard";
import DraggableCard from "../../components/DraggableCard";
import { fetchNews, fetchStock, chatWithGemini, uploadFile } from "../../lib/api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [news, setNews] = useState<any[]>([]);
  const [stock, setStock] = useState<any>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>("Loading...");
  const [geminiError, setGeminiError] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const result = await uploadFile(file);
    setUploadResult(result);
  };

  useEffect(() => {
    fetchNews().then((data) => setNews(data.articles || []));
    fetchStock("MSFT").then((data) => setStock(data));
    chatWithGemini("Summarize AI news today")
      .then((data) => {
        if (data.error) setGeminiError(JSON.stringify(data.error));
        else setGeminiResponse(data.text || "No response");
      })
      .catch(() => setGeminiError("Failed to fetch Gemini response"));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-6"
      >
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ChartCard />
          <DraggableCard />

          {/* Upload File Card */}
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-bold">Upload File</h2>
            <input type="file" onChange={handleUpload} />
  
            {uploadResult && (
              <div className="mt-2 text-sm">
                <p><strong>File Type:</strong> {uploadResult.type}</p>

                {uploadResult.type === "csv" && uploadResult.summary && (
                  <div className="mt-1 space-y-1">
                    <p><strong>Rows:</strong> {uploadResult.summary.num_rows}</p>
                    <p><strong>Columns:</strong> {uploadResult.summary.num_columns}</p>
                    <p><strong>Column Names:</strong> {uploadResult.summary.columns.join(", ")}</p>
                    {uploadResult.summary.label_counts && (
                      <p><strong>Label Counts:</strong> {JSON.stringify(uploadResult.summary.label_counts)}</p>
                    )}
                    {uploadResult.summary.sample_urls && (
                      <p><strong>Sample URLs:</strong> {uploadResult.summary.sample_urls.join(", ")}</p>
                    )}
                  </div>
                )}

                {uploadResult.type === "txt" && (
                  <p>{uploadResult.summary.preview}</p>
                )}

                {uploadResult.type === "pdf" && (
                  <p>{uploadResult.message}</p>
                )}
              </div>
            )}
          </div>


          {/* News Card */}
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Latest AI News</h2>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {news.map((article, i) => (
                <li key={i}>
                  <a
                    href={article.url}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {article.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stock Card */}
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Stock Data (MSFT)</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm max-h-60 overflow-y-auto">
              {JSON.stringify(stock, null, 2)}
            </pre>
          </div>

          {/* Gemini Card */}
          <div className="bg-white p-4 rounded-2xl shadow-md col-span-1 md:col-span-2 xl:col-span-3">
            <h2 className="text-xl font-semibold mb-2">Gemini Insights</h2>
            {geminiError ? (
              <p className="text-red-600">{geminiError}</p>
            ) : (
              <p className="whitespace-pre-wrap">{geminiResponse}</p>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
