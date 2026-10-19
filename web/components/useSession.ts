"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
};

let cached: Promise<SessionUser | null> | null = null;

function load(): Promise<SessionUser | null> {
  cached ??= fetch("/api/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : { user: null }))
    .then((d: { user: SessionUser | null }) => d.user)
    .catch(() => null);
  return cached;
}

/** Drops the cached session, e.g. after login or logout. */
export function invalidateSession() {
  cached = null;
}

/** Lightweight session lookup so marketing pages stay static and skip the Firebase SDK. */
export function useSession() {
  const [state, setState] = useState<{ user: SessionUser | null; loading: boolean }>({ user: null, loading: true });
  useEffect(() => {
    let alive = true;
    load().then((user) => alive && setState({ user, loading: false }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
