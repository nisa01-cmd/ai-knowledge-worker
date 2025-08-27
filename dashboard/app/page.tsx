"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/auth/login";
  }, []);

  return <p className="p-6 text-gray-600">Redirecting to login...</p>;
}
