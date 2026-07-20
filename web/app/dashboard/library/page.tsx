"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface WordItem {
  id: number;
  word: string;
  translation: string;
  meaning: string;
  level: string;
  correct_count: number;
}

export default function LibraryPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/words/")
      .then((data) => {
        setWords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch library", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="text-zinc-400 mt-1">Manage your saved vocabulary</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search words..." 
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading your vocabulary...</div>
      ) : words.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          Your library is empty. Use the Telegram bot to add some words!
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Word</th>
                <th className="px-6 py-4 font-medium">Translation</th>
                <th className="px-6 py-4 font-medium">Level</th>
                <th className="px-6 py-4 font-medium text-right">Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {words.map((w) => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{w.word}</td>
                  <td className="px-6 py-4 text-zinc-300">{w.translation}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                      {w.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${Math.min((w.correct_count / 5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
