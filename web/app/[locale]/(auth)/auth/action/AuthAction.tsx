"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/AuthUi";
import { useI18n } from "@/components/i18n";
import { authError, safeNext, startSession } from "@/lib/auth-client";
import { clientAuth } from "@/lib/firebase-client";

type State =
  | { step: "working" }
  | { step: "invalid" }
  | { step: "verified"; next: string }
  | { step: "reset"; email: string }
  | { step: "resetDone" };

function continuePath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin ? safeNext(url.pathname + url.search, fallback) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthAction() {
  const { locale, m } = useI18n();
  const params = useSearchParams();
  const auth = clientAuth();
  const [state, setState] = useState<State>({ step: "working" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";

  useEffect(() => {
    if (!auth || ran.current) return;
    ran.current = true;
    (async () => {
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, code);
          // Refresh the session on this device so the server sees the verified email.
          await auth.authStateReady();
          if (auth.currentUser) {
            await auth.currentUser.reload();
            await startSession(auth.currentUser, locale).catch(() => {});
          }
          const fallback = `/${locale}/welcome/diagnostic`;
          // The link continues to /verify-email?next=…; skip that screen and go straight to `next`.
          const cont = continuePath(params.get("continueUrl"), fallback);
          const inner = new URL(cont, window.location.origin).searchParams.get("next");
          setState({ step: "verified", next: cont.includes("/verify-email") ? safeNext(inner, fallback) : cont });
        } else if (mode === "resetPassword") {
          setState({ step: "reset", email: await verifyPasswordResetCode(auth, code) });
        } else {
          setState({ step: "invalid" });
        }
      } catch {
        setState({ step: "invalid" });
      }
    })();
  }, [auth, code, locale, mode, params]);

  async function onReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) return;
    const password = String(new FormData(e.currentTarget).get("password"));
    if (password.length < 8) return setError(m.auth.errors["auth/weak-password"]);
    setBusy(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, code, password);
      setState({ step: "resetDone" });
    } catch (err) {
      setError(authError(err, m));
    } finally {
      setBusy(false);
    }
  }

  if (!auth) return <AuthCard title={m.auth.verifyTitle}><FormMessage kind="info">{m.auth.notConfigured}</FormMessage></AuthCard>;

  switch (state.step) {
    case "working":
      return <Loader2 className="h-6 w-6 animate-spin text-muted" />;
    case "invalid":
      return (
        <AuthCard title={m.common.error}>
          <FormMessage>{m.auth.linkInvalid}</FormMessage>
          <Link href={`/${locale}/login`} className="btn-ghost btn-lg mt-5 w-full">{m.auth.backToLogin}</Link>
        </AuthCard>
      );
    case "verified":
      return (
        <AuthCard title={m.auth.verifiedTitle}>
          <CheckCircle2 className="mb-4 h-12 w-12 text-success" />
          <p className="text-muted">{m.auth.verifiedText}</p>
          <Link href={state.next} className="btn-primary btn-lg mt-6 w-full">{m.auth.continueToDiagnostic}</Link>
        </AuthCard>
      );
    case "reset":
      return (
        <AuthCard title={m.auth.resetNewTitle} text={state.email}>
          <form onSubmit={onReset} className="space-y-4">
            <Field label={m.auth.newPassword} name="password" type="password" autoComplete="new-password" minLength={8} required hint={m.auth.passwordHint} />
            {error && <FormMessage>{error}</FormMessage>}
            <SubmitButton busy={busy}>{m.auth.resetNewCta}</SubmitButton>
          </form>
        </AuthCard>
      );
    case "resetDone":
      return (
        <AuthCard title={m.auth.resetNewTitle}>
          <FormMessage kind="success">{m.auth.resetDone}</FormMessage>
          <Link href={`/${locale}/login`} className="btn-primary btn-lg mt-5 w-full">{m.nav.login}</Link>
        </AuthCard>
      );
  }
}
