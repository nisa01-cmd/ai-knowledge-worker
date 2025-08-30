"use client";
import React, { useState } from "react";
import { uploadFile } from "../lib/api";

// ---------- Card & Button Components ----------
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-lg ${className}`}>{children}</div>
);

const Button = ({
  children,
  onClick,
  disabled = false,
  className = "",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

// ---------- Main Component ----------
interface ManualUploadCardProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadResult: any;
}

export default function ManualUploadCard({ onUpload, uploadResult }: ManualUploadCardProps) {
  const [expanded, setExpanded] = useState(false);

  const renderPreview = () => {
    if (!uploadResult) return null;

    switch (uploadResult.type) {
      case "csv":
        if (!Array.isArray(uploadResult.preview)) return <p>No preview available.</p>;
        return (
          <div className="overflow-x-auto">
            <table className="table-auto border border-gray-200 text-sm">
              <thead>
                <tr>
                  {uploadResult.columns.map((col: string) => (
                    <th key={col} className="px-2 py-1 border bg-gray-100">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadResult.preview.map((row: any, i: number) => (
                  <tr key={i}>
                    {uploadResult.columns.map((col: string) => (
                      <td key={col} className="px-2 py-1 border">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              {uploadResult.rows} total rows, {uploadResult.columns.length} columns
            </p>
          </div>
        );

      case "txt":
      case "pdf":
        const snippet = uploadResult.preview || "";
        return (
          <div>
            <pre className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto text-sm">
              {expanded ? snippet : snippet.slice(0, 300) + (snippet.length > 300 ? "..." : "")}
            </pre>
            {snippet.length > 300 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                {expanded ? "Show less ▲" : "Show more ▼"}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Snippet from document (full text stored on backend)
            </p>
          </div>
        );

      default:
        return <p>Unsupported file type.</p>;
    }
  };

  return (
    <Card className="p-6 w-full">
      <h3 className="text-xl font-semibold mb-4">Manual Upload</h3>
      <input type="file" accept=".csv,.txt,.pdf" onChange={onUpload} className="mb-3" />
      {renderPreview()}

      {/* AI Insights */}
      {uploadResult?.ai_insights && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-4">
          <h4 className="font-semibold">🤖 AI Insights</h4>
          <p className="text-sm text-gray-700">{uploadResult.ai_insights}</p>
        </div>
      )}
    </Card>
  );
}
