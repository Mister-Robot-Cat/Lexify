"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Dialog } from "@/components/ui/Dialog";
import { errorText, postJson } from "@/lib/api-client";
import { fmt } from "@/lib/i18n/format";

export type PurchaseRow = {
  id: string;
  title: string;
  date: string;
  days: string;
  amount: string;
  status: "pending" | "paid" | "failed" | "refund_requested" | "refunded" | "cancelled";
  refundable: boolean;
  refundUntil: string | null;
};

const statusStyle: Record<PurchaseRow["status"], string> = {
  pending: "bg-amber-soft text-amber-deep",
  paid: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  refund_requested: "bg-amber-soft text-amber-deep",
  refunded: "bg-sand text-ink/70",
  cancelled: "bg-sand text-ink/70",
};

export function Purchases({ rows }: { rows: PurchaseRow[] }) {
  const { m } = useI18n();
  const a = m.account;
  const router = useRouter();
  const [refund, setRefund] = useState<PurchaseRow | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!refund) return;
    setBusy(true);
    setError(null);
    try {
      await postJson(`/api/orders/${encodeURIComponent(refund.id)}/refund`, { reason });
      setSent(true);
      setRefund(null);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(errorText(err, a.errors));
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) return <p className="mt-3 text-muted">{a.noPurchases}</p>;
  return (
    <>
      {sent && (
        <p role="status" className="mt-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {a.refundSent}
        </p>
      )}
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted">
                {fmt(a.order, { date: r.date })} · {r.days} · {r.amount}
              </p>
              {r.refundable && r.refundUntil && <p className="text-xs text-muted">{fmt(a.refundUntil, { date: r.refundUntil })}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[r.status]}`}>{a.status[r.status]}</span>
              {r.refundable && (
                <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setRefund(r)}>
                  {a.requestRefund}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Dialog
        open={!!refund}
        onClose={() => !busy && setRefund(null)}
        title={a.refundTitle}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setRefund(null)} disabled={busy}>
              {m.common.cancel}
            </button>
            <button className="btn-primary" onClick={send} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {a.refundSend}
            </button>
          </>
        }
      >
        <p>{a.refundText}</p>
        <label className="label mt-4" htmlFor="refund-reason">
          {a.refundReason}
        </label>
        <textarea id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={3} className="input" />
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
