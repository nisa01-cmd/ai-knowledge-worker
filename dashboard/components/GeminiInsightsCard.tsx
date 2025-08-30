"use client";
import React from "react";
import { RefreshCw } from "lucide-react";

interface GeminiInsightsCardProps {
  response: string;
  error?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function GeminiInsightsCard({ response, error, onRefresh, loading }: GeminiInsightsCardProps) {
  return (
    <div className="flex flex-col h-full p-4 bg-white rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">Gemini Insights</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="whitespace-pre-wrap">{response}</p>
        )}
      </div>
    </div>
  );
}
