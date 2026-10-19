"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Asks the server (which asks the provider) until the order leaves "pending". */
export function PendingRefresher({ orderId }: { orderId: string }) {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { status: string }) : null;
      if ((data && data.status !== "pending") || tries >= 40) {
        clearInterval(id);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(id);
  }, [orderId, router]);
  return null;
}
