"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/AuthUi";
import { useI18n } from "@/components/i18n";
import { authError, reloadTo, safeNext, startSession } from "@/lib/auth-client";
import { clientAuth, setAuthLanguage } from "@/lib/firebase-client";

export function SignupForm() {
  const { locale, m } = useI18n();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), `/${locale}/welcome/diagnostic`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = clientAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (password.length < 8) return setError(m.auth.errors["auth/weak-password"]);
    setBusy(true);
    setError(null);
    try {
      setAuthLanguage(locale);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(user, { displayName: name.slice(0, 80) });
      await sendEmailVerification(user, { url: `${window.location.origin}/${locale}/verify-email?next=${encodeURIComponent(next)}` });
      await startSession(user, locale);
      reloadTo(`/${locale}/verify-email?next=${encodeURIComponent(next)}`);
    } catch (err) {
      setError(authError(err, m));
      setBusy(false);
    }
  }

  const [before, middle, after] = m.auth.agree.split(/\{terms\}|\{privacy\}/);

  return (
    <AuthCard title={m.auth.signupTitle} text={m.auth.signupText}>
      {!auth ? (
        <FormMessage kind="info">{m.auth.notConfigured}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={m.auth.name} name="name" autoComplete="name" maxLength={80} />
          <Field label={m.auth.email} name="email" type="email" autoComplete="email" required />
          <Field label={m.auth.password} name="password" type="password" autoComplete="new-password" minLength={8} required hint={m.auth.passwordHint} />
          {error && <FormMessage>{error}</FormMessage>}
          <SubmitButton busy={busy}>{m.auth.signupCta}</SubmitButton>
          <p className="text-xs leading-5 text-muted">
            {before}
            <Link href={`/${locale}/terms`} className="underline">{m.auth.termsLink}</Link>
            {middle}
            <Link href={`/${locale}/privacy`} className="underline">{m.auth.privacyLink}</Link>
            {after}
          </p>
        </form>
      )}
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        {m.auth.haveAccount}{" "}
        <Link href={`/${locale}/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
          {m.nav.login}
        </Link>
      </p>
    </AuthCard>
  );
}
