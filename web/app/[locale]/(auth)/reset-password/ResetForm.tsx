"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/AuthUi";
import { useI18n } from "@/components/i18n";
import { authError } from "@/lib/auth-client";
import { clientAuth, setAuthLanguage } from "@/lib/firebase-client";
import { fmt } from "@/lib/i18n/format";

export function ResetForm() {
  const { locale, m } = useI18n();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const auth = clientAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) return;
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    try {
      setAuthLanguage(locale);
      await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/${locale}/login` });
      setSentTo(email);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Don't reveal whether an account exists.
      if (code === "auth/user-not-found") setSentTo(email);
      else setError(authError(err, m));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={m.auth.resetTitle} text={m.auth.resetText}>
      {!auth ? (
        <FormMessage kind="info">{m.auth.notConfigured}</FormMessage>
      ) : sentTo ? (
        <FormMessage kind="success">{fmt(m.auth.resetSent, { email: sentTo })}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={m.auth.email} name="email" type="email" autoComplete="email" required />
          {error && <FormMessage>{error}</FormMessage>}
          <SubmitButton busy={busy}>{m.auth.resetCta}</SubmitButton>
        </form>
      )}
      <p className="mt-6 border-t border-line pt-5 text-center text-sm">
        <Link href={`/${locale}/login`} className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
          {m.auth.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}
