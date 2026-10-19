"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Seconds left until `deadline` (server ms). `serverNow` corrects for a
 * wrong clock on the user's device.
 */
export function useCountdown(deadline: number, serverNow: number, onZero?: () => void) {
  const [offset] = useState(() => serverNow - Date.now());
  const [left, setLeft] = useState(() => Math.max(0, Math.round((deadline - serverNow) / 1000)));
  const fired = useRef(false);
  const cb = useRef(onZero);
  useEffect(() => {
    cb.current = onZero;
  }, [onZero]);

  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.round((deadline - (Date.now() + offset)) / 1000));
      setLeft(s);
      if (s === 0 && !fired.current) {
        fired.current = true;
        cb.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, offset]);
  return left;
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
