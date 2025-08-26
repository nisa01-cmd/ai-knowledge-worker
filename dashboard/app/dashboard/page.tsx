"use client";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ChartCard from "@/components/ChartCard";
import DraggableCard from "@/components/DraggableCard";

export default function Dashboard() {
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

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ChartCard />
          <DraggableCard />
          {/* Future: Add more cards here */}
        </div>
      </motion.main>
    </div>
  );
}
