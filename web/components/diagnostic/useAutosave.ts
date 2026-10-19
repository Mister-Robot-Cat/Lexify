"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/api-client";
import type { SaveState } from "./TestShell";

/** Saves `payload` to the server a moment after it stops changing. */
export function useAutosave(attemptId: string, payload: Record<string, unknown>, enabled: boolean) {
  const [state, setState] = useState<SaveState>("idle");
  const last = useRef(JSON.stringify(payload));
  const json = JSON.stringify(payload);

  useEffect(() => {
    if (!enabled || json === last.current) return;
    const id = setTimeout(async () => {
      setState("saving");
      try {
        await postJson("/api/diagnostic/save", { attemptId, ...JSON.parse(json) });
        last.current = json;
        setState("saved");
      } catch {
        setState("error");
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [attemptId, json, enabled]);

  return state;
}
