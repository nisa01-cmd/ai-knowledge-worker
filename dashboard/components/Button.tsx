// Button.tsx
import React from "react";

export function Button({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
