"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { postJson } from "@/lib/api-client";

export function SandboxPay({ orderId, payLabel, failLabel, done }: { orderId: string; payLabel: string; failLabel: string; done: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function send(outcome: "paid" | "failed") {
    setBusy(true);
    await postJson("/api/payments/sandbox", { orderId, outcome }).catch(() => null);
    router.push(done);
  }
  return (
    <div className="mt-6 flex flex-col gap-3">
      <button className="btn-primary btn-lg" disabled={busy} onClick={() => send("paid")}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {payLabel}
      </button>
      <button className="btn-ghost" disabled={busy} onClick={() => send("failed")}>
        {failLabel}
      </button>
    </div>
  );
}
