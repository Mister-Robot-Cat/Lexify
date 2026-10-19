"use client";

import { createContext, useContext } from "react";
import type { AdminMessages } from "@/messages/admin/en";

const Ctx = createContext<AdminMessages | null>(null);

export function AdminI18nProvider({ messages, children }: { messages: AdminMessages; children: React.ReactNode }) {
  return <Ctx.Provider value={messages}>{children}</Ctx.Provider>;
}

export function useAdminI18n(): AdminMessages {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  return a;
}
