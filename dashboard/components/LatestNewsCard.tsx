"use client";
import React from "react";

interface LatestNewsCardProps {
  news: { title: string; url: string }[];
}

export default function LatestNewsCard({ news }: LatestNewsCardProps) {
  return (
    <div className="flex flex-col h-full p-4 bg-white rounded-2xl shadow-md">
      <h3 className="text-xl font-semibold mb-2">Latest AI News</h3>
      <ul className="space-y-2 overflow-auto flex-1">
        {news.length === 0 && <p className="text-gray-500 text-sm">No news available.</p>}
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
  );
}
