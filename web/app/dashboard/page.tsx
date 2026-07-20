"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app, we would fetch stats here
    // fetchApi('/users/stats').then(setStats)
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold">Welcome back!</h1>
      <p className="mb-8 text-zinc-400">Here's your vocabulary progress overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-zinc-400">Total Words</h3>
          <p className="mt-2 text-3xl font-bold text-white">--</p>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-zinc-400">Mastered</h3>
          <p className="mt-2 text-3xl font-bold text-green-400">--</p>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-zinc-400">Needs Review</h3>
          <p className="mt-2 text-3xl font-bold text-blue-400">--</p>
        </div>
      </div>
      
      <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Ready for your daily review?</h2>
        <button className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700">
          Start Quiz Session
        </button>
      </div>
    </div>
  );
}
