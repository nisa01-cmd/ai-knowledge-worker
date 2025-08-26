import { Home, BarChart3, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">AI Worker</h2>
      <nav className="space-y-4">
        <a href="/dashboard" className="flex items-center gap-2 hover:text-blue-400">
          <Home size={20}/> Dashboard
        </a>
        <a href="#" className="flex items-center gap-2 hover:text-blue-400">
          <BarChart3 size={20}/> Insights
        </a>
        <a href="/auth/login" className="flex items-center gap-2 hover:text-red-400 mt-10">
          <LogOut size={20}/> Logout
        </a>
      </nav>
    </aside>
  );
}
