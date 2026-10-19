"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShieldCheck, Gift } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { fmt, plural } from "@/lib/i18n/format";
import {
  CUSTOM_MAX_DAYS,
  CUSTOM_MIN_DAYS,
  PAYMENTS_ENABLED,
  PLAN_IDS,
  PLANS,
  customPrice,
  formatAzn,
  perDayPrice,
} from "@/lib/pricing";

function Price({ amount }: { amount: number }) {
  return PAYMENTS_ENABLED ? (
    <span className="font-display text-4xl font-semibold">{formatAzn(amount)}</span>
  ) : (
    <span className="flex items-baseline gap-2">
      <span className="font-display text-4xl font-semibold">{formatAzn(0)}</span>
      <span className="text-lg text-muted line-through">{formatAzn(amount)}</span>
    </span>
  );
}

export function Pricing({ courseId = "ielts-academic" }: { courseId?: string }) {
  const { locale, m } = useI18n();
  const [days, setDays] = useState(60);
  const daysLabel = (n: number) => `${n} ${plural(locale, n, m.common.days)}`;
  const buy = (q: string) => `/${locale}/buy/${courseId}?${q}`;
  const cta = PAYMENTS_ENABLED ? m.pricing.choose : m.pricing.getFree;

  return (
    <div>
      {!PAYMENTS_ENABLED && (
        <div className="mx-auto mb-8 flex max-w-xl items-center justify-center gap-2 rounded-full bg-amber-soft px-4 py-2.5 text-center text-sm font-semibold text-amber-deep">
          <Gift className="h-4 w-4 shrink-0" /> {m.pricing.launchBanner}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const plan = PLANS[id];
          const popular = id === "month";
          return (
            <div
              key={id}
              className={`card relative flex flex-col p-6 ${popular ? "border-ink shadow-[var(--shadow-lift)] md:-translate-y-2" : ""}`}
            >
              {popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-amber px-3 py-1 text-xs font-bold text-ink">{m.pricing.popular}</span>
              )}
              <h3 className="text-lg font-bold">{m.pricing.plans[id].name}</h3>
              <p className="mt-1 text-sm text-muted">{m.pricing.plans[id].note}</p>
              <div className="mt-5">
                <Price amount={plan.price} />
                <p className="mt-1 text-sm text-muted">
                  {formatAzn(Math.round((plan.price / plan.days) * 100) / 100)} {m.common.perDay}
                </p>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {m.pricing.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={buy(`plan=${id}`)} className={`mt-6 ${popular ? "btn-primary" : "btn-ghost"} btn-lg w-full`}>
                {cta}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 className="text-lg font-bold">{m.pricing.customTitle}</h3>
          <p className="mt-1 text-sm text-muted">{m.pricing.customText}</p>
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold tabular-nums">{daysLabel(days)}</span>
              <span className="text-sm text-muted">
                {formatAzn(Math.round(perDayPrice(days) * 100) / 100)} {m.common.perDay}
              </span>
            </div>
            <input
              type="range"
              min={CUSTOM_MIN_DAYS}
              max={CUSTOM_MAX_DAYS}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-[var(--color-ink)]"
              aria-label={m.pricing.customTitle}
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>{daysLabel(CUSTOM_MIN_DAYS)}</span>
              <span>{daysLabel(CUSTOM_MAX_DAYS)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 md:min-w-56 md:items-end">
          <span className="text-sm text-muted">{m.pricing.total}</span>
          <Price amount={customPrice(days)} />
          <Link href={buy(`plan=custom&days=${days}`)} className="btn-primary btn-lg w-full">
            {fmt(m.pricing.customCta, { days: daysLabel(days) })}
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-muted sm:flex-row sm:gap-8">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" /> {m.pricing.guarantee}
        </span>
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" /> {m.pricing.oneTime}
        </span>
      </div>
    </div>
  );
}
