"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";


export default function RegisterPage() {
const [form, setForm] = useState({ name: "", email: "", password: "" });
const [err, setErr] = useState("");
const [ok, setOk] = useState("");


const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });


const handleSubmit = async (e: any) => {
e.preventDefault();
setErr("");
setOk("");
try {
await api.post("/auth/register", form);
setOk("Registered! You can log in now.");
} catch (e: any) {
setErr(e?.response?.data?.detail || "Registration failed");
}
};


return (
<div className="min-h-screen flex items-center justify-center bg-gray-900">
<motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl w-96">
<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
<form onSubmit={handleSubmit} className="flex flex-col space-y-4">
<input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="p-3 border rounded-lg" required />
<input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-3