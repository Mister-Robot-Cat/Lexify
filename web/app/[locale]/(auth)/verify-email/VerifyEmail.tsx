"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification, type User } from "firebase/auth";
import { Loader2, MailCheck } from "lucide-react";
import { AuthCard, FormMessage } from "@/components/auth/AuthUi";
import { useI18n } from "@/components/i18n";
import { authError, reloadTo, safeNext, signOut, startSession } from "@/lib/auth-client";
import { clientAuth, setAuthLanguage } from "@/lib/firebase-client";
import { fmt } from "@/lib/i18n/format";

export function VerifyEmail() {
  const { locale, m } = useI18n();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), `/${locale}/welcome/diagnostic`);
  const auth = clientAuth();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [busy, setBusy] = useState<"check" | "resend" | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "info" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, [auth]);

  async function check() {
    if (!user) return;
    setBusy("check");
    setMsg(null);
    try {
      await user.reload();
      if (!user.emailVerified) {
        setMsg({ kind: "info", text: m.auth.verifyStill });
        return;
      }
      await startSession(user, locale);
      reloadTo(next);
    } catch (err) {
      setMsg({ kind: "error", text: authError(err, m) });
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    if (!user || !auth) return;
    setBusy("resend");
    setMsg(null);
    try {
      setAuthLanguage(locale);
      await sendEmailVerification(user, { url: `${window.location.origin}/${locale}/verify-email?next=${encodeURIComponent(next)}` });
      setMsg({ kind: "success", text: m.auth.verifyResent });
    } catch (err) {
      setMsg({ kind: "error", text: authError(err, m) });
    } finally {
      setBusy(null);
    }
  }

  if (!auth) return <AuthCard title={m.auth.verifyTitle}><FormMessage kind="info">{m.auth.notConfigured}</FormMessage></AuthCard>;
  if (user === undefined) return <Loader2 className="h-6 w-6 animate-spin text-muted" />;
  if (user === null) {
    return (
      <AuthCard title={m.auth.verifyTitle}>
        <Link href={`/${locale}/login?next=${encodeURIComponent(next)}`} className="btn-primary btn-lg w-full">
          {m.nav.login}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={m.auth.verifyTitle}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-soft text-amber-deep">
        <MailCheck className="h-7 w-7" />
      </div>
      <p className="text-muted">{fmt(m.auth.verifyText, { email: user.email ?? "" })}</p>
      <div className="mt-6 space-y-3">
        {msg && <FormMessage kind={msg.kind}>{msg.text}</FormMessage>}
        <button onClick={check} disabled={!!busy} className="btn-primary btn-lg w-full">
          {busy === "check" && <Loader2 className="h-4 w-4 animate-spin" />} {m.auth.verifyDone}
        </button>
        <button onClick={resend} disabled={!!busy} className="btn-ghost btn-lg w-full">
          {busy === "resend" && <Loader2 className="h-4 w-4 animate-spin" />} {m.auth.verifyResend}
        </button>
      </div>
      <button
        onClick={async () => {
          await signOut();
          reloadTo(`/${locale}/login`);
        }}
        className="mt-6 w-full text-center text-sm font-semibold text-muted hover:text-ink"
      >
        {m.auth.wrongEmail}
      </button>
    </AuthCard>
  );
}
