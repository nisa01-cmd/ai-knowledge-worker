"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";


export default function LoginPage() {
const { login } = useAuth();
const [form, setForm] = useState({ email: "", password: "" });
const [err, setErr] = useState("");


const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });


const handleSubmit = async (e: any) => {
e.preventDefault();
setErr("");
try {
const res = await api.post("/auth/login", form);
login(res.data.access_token, res.data.user);
window.location.href = "/dashboard";
} catch (e: any) {
setErr(e?.response?.data?.detail || "Login failed");
}
};


return (
<div className="min-h-screen flex items-center justify-center bg-gray-900">
<motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl w-96">
<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
<form onSubmit={handleSubmit} className="flex flex-col space-y-4">
<input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-3 border rounded-lg" required />
<input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="p-3 border rounded-lg" required />
{err && <p className="text-red-600 text-sm">{err}</p>}
<button type="submit" className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Login</button>
</form>
<p className="text-center mt-4 text-sm text-gray-600">Don’t have an account? <a href="/auth/register" className="text-blue-500">Register</a></p>
</motion.div>
</div>
);
}