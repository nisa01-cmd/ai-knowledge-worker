"use client";
import { motion } from "framer-motion";

export default function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      whileHover={{ scale: 1.05 }}
      className="bg-yellow-200 p-6 rounded-2xl shadow-lg cursor-grab"
    >
      <h3 className="text-xl font-bold">Draggable Card</h3>
      <p className="text-gray-700">Move me around with your mouse!</p>
    </motion.div>
  );
}
