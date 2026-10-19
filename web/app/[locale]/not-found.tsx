"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/i18n";

export default function NotFound() {
  const { locale, m } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-semibold text-amber">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">{m.notFound.title}</h1>
      <p className="mt-2 text-muted">{m.notFound.text}</p>
      <Link href={`/${locale}`} className="btn-primary btn-lg mt-8">
        {m.notFound.home}
      </Link>
    </div>
  );
}
