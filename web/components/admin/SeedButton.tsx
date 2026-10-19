"use client";

import { Loader2 } from "lucide-react";
import { useAdminI18n } from "./AdminI18n";
import { adminRequest, useAdminAction } from "./useAdminAction";

export function SeedButton() {
  const a = useAdminI18n();
  const { busy, error, run } = useAdminAction();
  return (
    <div className="rounded-xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm">
      <p className="font-semibold text-amber-deep">{a.overview.seedTitle}</p>
      <p className="mt-1">{a.overview.seedText}</p>
      <button className="btn-primary mt-3 px-3 py-1.5 text-sm" disabled={busy} onClick={() => run(() => adminRequest("/api/admin/seed", "POST"))}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {a.overview.seedButton}
      </button>
      {error && <p className="mt-2 text-danger">{error}</p>}
    </div>
  );
}
