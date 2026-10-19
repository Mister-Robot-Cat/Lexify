"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { useAdminI18n } from "./AdminI18n";

export async function adminRequest<T = { ok: true }>(url: string, method: "POST" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw Object.assign(new ApiError(res.status, data.error ?? "generic"), { detail: data.message });
  return data as T;
}

/** Runs an admin request with busy and error state, then refreshes the server-rendered page. */
export function useAdminAction() {
  const a = useAdminI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function run<T>(fn: () => Promise<T>, opts: { confirm?: string; refresh?: boolean } = {}): Promise<T | undefined> {
    if (opts.confirm && !window.confirm(opts.confirm)) return undefined;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const out = await fn();
      setDone(true);
      if (opts.refresh !== false) router.refresh();
      return out;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "generic";
      const text = (a.errors as Record<string, string>)[code] ?? a.errors.generic;
      const detail = (err as { detail?: string }).detail;
      // Validation errors carry the field that failed, which helps when editing JSON.
      setError(detail && detail !== code ? `${text} ${detail}` : text);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, done, run, setError };
}
