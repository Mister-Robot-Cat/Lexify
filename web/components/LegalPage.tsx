import { Markdown } from "@/components/Markdown";
import { legal, LEGAL_UPDATED, type LegalDoc } from "@/content/legal";
import type { Locale } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import type { Messages } from "@/messages/en";

export function LegalPage({ doc, locale, m }: { doc: LegalDoc; locale: Locale; m: Messages }) {
  const { title, body } = legal[doc][locale];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(LEGAL_UPDATED));
  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{fmt(m.legal.updated, { date })}</p>
      <p className="mt-4 rounded-xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm text-amber-deep">{m.legal.draftNote}</p>
      <div className="card mt-8 p-6 sm:p-8">
        <Markdown>{body}</Markdown>
      </div>
    </article>
  );
}

export function legalMetadata(doc: LegalDoc, locale: Locale, path: string) {
  return { title: legal[doc][locale].title, alternates: { canonical: `/${locale}${path}` } };
}
