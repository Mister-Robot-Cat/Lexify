"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/AuthUi";
import { useI18n } from "@/components/i18n";
import { authError, reloadTo, safeNext, startSession } from "@/lib/auth-client";
import { clientAuth } from "@/lib/firebase-client";

export function LoginForm() {
  const { locale, m } = useI18n();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), `/${locale}/app`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = clientAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, String(form.get("email")).trim(), String(form.get("password")));
      const session = await startSession(user, locale);
      // Keep the path but switch to the language saved in the profile.
      const target = next.replace(/^\/(az|en|ru)(?=\/|$)/, `/${session.locale}`);
      reloadTo(
        session.emailVerified ? target : `/${session.locale}/verify-email?next=${encodeURIComponent(target)}`,
      );
    } catch (err) {
      setError(authError(err, m));
      setBusy(false);
    }
  }

  return (
    <AuthCard title={m.auth.loginTitle} text={m.auth.loginText}>
      {!auth ? (
        <FormMessage kind="info">{m.auth.notConfigured}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={m.auth.email} name="email" type="email" autoComplete="email" required />
          <Field label={m.auth.password} name="password" type="password" autoComplete="current-password" required />
          <div className="-mt-1 text-right">
            <Link href={`/${locale}/reset-password`} className="text-sm font-semibold text-muted hover:text-ink">
              {m.auth.forgot}
            </Link>
          </div>
          {error && <FormMessage>{error}</FormMessage>}
          <SubmitButton busy={busy}>{m.auth.loginCta}</SubmitButton>
        </form>
      )}
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        {m.auth.noAccount}{" "}
        <Link href={`/${locale}/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
          {m.nav.signup}
        </Link>
      </p>
    </AuthCard>
  );
}
