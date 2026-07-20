"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, BookOpen, LayoutDashboard, BrainCircuit } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/library", label: "My Library", icon: BookOpen },
    { href: "/dashboard/quiz", label: "Quiz Practice", icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">L</div>
          <span className="text-xl font-bold">Lexify</span>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                  active 
                    ? "bg-blue-600/10 text-blue-400 font-medium" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="mb-4">
            <p className="text-sm font-medium">{user.telegram_id}</p>
            <p className="text-xs text-zinc-500">Learning {user.learning_language}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
