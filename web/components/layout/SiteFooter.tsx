import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/messages/en";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "@/lib/site";

function SocialIcon({ id }: { id: (typeof SOCIAL_LINKS)[number]["id"] }) {
  const paths: Record<typeof id, string> = {
    instagram:
      "M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.2 4.2-.2Z",
    telegram:
      "M20.7 4.3 2.9 11.2c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.8 5.4c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.2c.3-1.2-.5-1.8-1.5-1.3Zm-3 3.3-8.2 7.4-.3 3.4-1.6-4.9 9.6-6.1c.4-.3.8-.1.5.2Z",
    youtube:
      "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z",
    tiktok:
      "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={paths[id]} />
    </svg>
  );
}

export function SiteFooter({ locale, m }: { locale: Locale; m: Messages }) {
  const home = `/${locale}`;
  return (
    <footer className="no-print mt-24 border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">{m.footer.tagline}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">{m.footer.product}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href={`${home}/welcome/diagnostic`}>{m.nav.diagnostic}</Link></li>
            <li><Link className="hover:text-ink" href={`${home}/preview`}>{m.nav.preview}</Link></li>
            <li><Link className="hover:text-ink" href={`${home}#pricing`}>{m.nav.pricing}</Link></li>
            <li><Link className="hover:text-ink" href={`${home}#faq`}>{m.nav.faq}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">{m.footer.legal}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href={`${home}/terms`}>{m.footer.terms}</Link></li>
            <li><Link className="hover:text-ink" href={`${home}/privacy`}>{m.footer.privacy}</Link></li>
            <li><Link className="hover:text-ink" href={`${home}/refund-policy`}>{m.footer.refund}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">{m.footer.follow}</h3>
          <div className="flex gap-2">
            {SOCIAL_LINKS.filter((s) => s.href).map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink/80 hover:border-ink/30 hover:text-ink"
              >
                <SocialIcon id={s.id} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Lexify. {m.footer.rights}</p>
          <p className="max-w-2xl sm:text-right">{m.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
