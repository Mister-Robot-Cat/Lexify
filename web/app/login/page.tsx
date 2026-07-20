"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [devId, setDevId] = useState("");

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Attempt to auto-login if opened inside Telegram Mini App
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    if (tg && tg.initData) {
      login(tg.initData).catch(() => setError("Failed to authenticate via Telegram Mini App."));
    }
  }, [login]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(devId); // In dev, the backend allows raw ID
    } catch (err) {
      setError("Failed to login with Dev ID.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-3xl font-bold text-white text-center">Welcome to Lexify</h1>
        <p className="mb-8 text-center text-zinc-400">Sign in to sync your vocabulary</p>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500 text-center">
            Open this app inside Telegram to login automatically.
          </p>
          
          <div className="my-4 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            <span className="text-xs text-zinc-600">OR DEV LOGIN</span>
          </div>

          <form onSubmit={handleDevLogin} className="flex flex-col gap-3">
            <input
              type="text"
              value={devId}
              onChange={(e) => setDevId(e.target.value)}
              placeholder="Enter Telegram ID (e.g., 12345)"
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Dev Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
