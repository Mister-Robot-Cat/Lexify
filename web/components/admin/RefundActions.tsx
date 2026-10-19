"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { fmt } from "@/lib/i18n/format";
import { useAdminI18n } from "./AdminI18n";
import { adminRequest, useAdminAction } from "./useAdminAction";

export function RefundActions({ orderId, amount, days, canReject }: { orderId: string; amount: string; days: number; canReject: boolean }) {
  const a = useAdminI18n();
  const o = a.orders;
  const { busy, error, run } = useAdminAction();
  const [note, setNote] = useState("");
  const send = (action: "approve" | "reject") =>
    run(() => adminRequest(`/api/admin/orders/${encodeURIComponent(orderId)}`, "POST", { action, note }), {
      confirm: action === "approve" ? fmt(o.approveConfirm, { amount, days }) : o.rejectConfirm,
    });
  return (
    <div className="mt-3 rounded-xl bg-sand/60 p-3">
      <label className="label" htmlFor={`note-${orderId}`}>
        {o.note}
      </label>
      <input id={`note-${orderId}`} className="input" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="btn-primary px-3 py-1.5 text-sm" disabled={busy} onClick={() => send("approve")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {o.approve}
        </button>
        {canReject && (
          <button className="btn-ghost px-3 py-1.5 text-sm" disabled={busy} onClick={() => send("reject")}>
            {o.reject}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
