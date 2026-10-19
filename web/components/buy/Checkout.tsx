"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Gift, Loader2, ShieldCheck, Tag, X } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { ApiError, errorText, postJson } from "@/lib/api-client";
import { fmt, plural } from "@/lib/i18n/format";
import { reloadTo } from "@/lib/navigate";
import { CUSTOM_MAX_DAYS, CUSTOM_MIN_DAYS, PAYMENTS_ENABLED, PLAN_IDS, PLANS, customPrice, formatAzn, perDayPrice, type PlanId } from "@/lib/pricing";

type Plan = PlanId | "custom";
type Quote = { listPrice: number; discount: number; amount: number; promoCode: string | null };

export function Checkout({ course, initialPlan, initialDays }: { course: { id: string; title: string }; initialPlan: Plan; initialDays: number }) {
  const { locale, m } = useI18n();
  const b = m.buy;
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [days, setDays] = useState(initialDays);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const daysOf = (p: Plan, d = days) => (p === "custom" ? d : PLANS[p].days);
  const priceOf = (p: Plan, d = days) => (p === "custom" ? customPrice(d) : PLANS[p].price);
  const daysLabel = (n: number) => `${n} ${plural(locale, n, m.common.days)}`;
  const list = priceOf(plan);
  const discount = Math.min(list, promo?.discount ?? 0);
  const afterPromo = Math.max(0, Math.round((list - discount) * 100) / 100);
  const total = PAYMENTS_ENABLED ? afterPromo : 0;
  const body = (p: Plan, d: number, c: string | null) => ({ courseId: course.id, plan: p, days: p === "custom" ? d : undefined, promo: c });

  /** The promo discount depends on the price, so it is re-checked by the server whenever the plan changes. */
  function requote(p: Plan, d: number) {
    if (!promo) return;
    if (timer.current) clearTimeout(timer.current);
    const c = promo.code;
    timer.current = setTimeout(async () => {
      try {
        const q = await postJson<Quote>("/api/checkout/quote", body(p, d, c));
        setPromo({ code: c, discount: q.discount });
      } catch (err) {
        setPromo(null);
        setPromoError(errorText(err, b.errors));
      }
    }, 250);
  }

  function choose(p: Plan) {
    setPlan(p);
    setError(null);
    requote(p, days);
  }

  async function applyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const q = await postJson<Quote>("/api/checkout/quote", body(plan, days, code));
      setPromo({ code: q.promoCode ?? code, discount: q.discount });
      setCode("");
    } catch (err) {
      setPromoError(errorText(err, b.errors));
    } finally {
      setPromoBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ orderId: string; redirectUrl: string }>("/api/checkout", { ...body(plan, days, promo?.code ?? null), locale, agree: true });
      if (res.redirectUrl.startsWith("/")) router.push(res.redirectUrl);
      else reloadTo(res.redirectUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code.startsWith("promo_")) setPromo(null);
      setError(errorText(err, b.errors));
      setBusy(false);
    }
  }

  return (
    <div className="container-page grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
      <div>
        <p className="eyebrow">{b.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{fmt(b.title, { course: course.title })}</h1>

        <h2 className="mt-8 text-lg font-bold">{b.choosePlan}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup">
          {PLAN_IDS.map((id) => (
            <PlanCard
              key={id}
              selected={plan === id}
              onSelect={() => choose(id)}
              title={m.pricing.plans[id].name}
              note={m.pricing.plans[id].note}
              price={PLANS[id].price}
              perDay={PLANS[id].price / PLANS[id].days}
            />
          ))}
        </div>

        <div
          role="radio"
          aria-checked={plan === "custom"}
          tabIndex={0}
          onClick={() => plan !== "custom" && choose("custom")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && plan !== "custom" && choose("custom")}
          className={`card mt-3 cursor-pointer p-5 transition ${plan === "custom" ? "border-ink ring-2 ring-ink" : "hover:border-ink/30"}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-bold">{b.custom}</span>
            <span className="text-sm text-muted">
              {formatAzn(Math.round(perDayPrice(days) * 100) / 100)} {m.common.perDay}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="w-24 shrink-0 font-display text-2xl font-semibold">{daysLabel(days)}</span>
            <input
              type="range"
              min={CUSTOM_MIN_DAYS}
              max={CUSTOM_MAX_DAYS}
              value={days}
              aria-label={b.custom}
              onChange={(e) => {
                const d = Number(e.target.value);
                setDays(d);
                setPlan("custom");
                requote("custom", d);
              }}
              className="w-full accent-[var(--color-ink)]"
            />
          </div>
        </div>

        <form onSubmit={applyPromo} className="mt-8">
          <label htmlFor="promo" className="label">
            {b.promo}
          </label>
          {promo ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-semibold text-success">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" /> {fmt(b.promoApplied, { code: promo.code })}
              </span>
              <button type="button" onClick={() => setPromo(null)} className="flex items-center gap-1 text-muted hover:text-ink">
                <X className="h-4 w-4" /> {b.remove}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder={b.promoPlaceholder} className="input uppercase" autoComplete="off" maxLength={40} />
              <button type="submit" className="btn-ghost shrink-0" disabled={promoBusy || !code.trim()}>
                {promoBusy && <Loader2 className="h-4 w-4 animate-spin" />} {b.apply}
              </button>
            </div>
          )}
          {promoError && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {promoError}
            </p>
          )}
        </form>
      </div>

      <aside className="lg:pt-16">
        <div className="card sticky top-24 p-6">
          <h2 className="text-lg font-bold">{b.summary}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label={fmt(b.listPrice, { days: daysLabel(daysOf(plan)) })} value={formatAzn(list)} />
            {promo && discount > 0 && <Row label={fmt(b.promoDiscount, { code: promo.code })} value={`−${formatAzn(discount)}`} accent />}
            {!PAYMENTS_ENABLED && afterPromo > 0 && <Row label={b.launchDiscount} value={`−${formatAzn(afterPromo)}`} accent />}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-bold">{b.total}</span>
            <span className="font-display text-3xl font-semibold">{formatAzn(total)}</span>
          </div>
          <p className="mt-3 text-sm text-muted">{fmt(b.accessFor, { days: daysLabel(daysOf(plan)) })}</p>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-ink)]" />
            <span>
              {b.agreeStart}{" "}
              <Link href={`/${locale}/terms`} target="_blank" className="font-semibold underline">
                {b.termsLink}
              </Link>{" "}
              {b.and}{" "}
              <Link href={`/${locale}/refund-policy`} target="_blank" className="font-semibold underline">
                {b.refundLink}
              </Link>
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button onClick={submit} disabled={!agree || busy} className="btn-primary btn-lg mt-5 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {total > 0 ? fmt(b.payCta, { amount: formatAzn(total) }) : b.freeCta}
          </button>

          <ul className="mt-5 space-y-2 text-xs text-muted">
            {PAYMENTS_ENABLED ? (
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" /> {b.secure}
              </li>
            ) : (
              <li className="flex gap-2">
                <Gift className="h-4 w-4 shrink-0 text-amber-deep" /> {b.freeNote}
              </li>
            )}
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-success" /> {m.pricing.guarantee}
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-success" /> {m.pricing.oneTime}
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function PlanCard({ selected, onSelect, title, note, price, perDay }: { selected: boolean; onSelect: () => void; title: string; note: string; price: number; perDay: number }) {
  const { m } = useI18n();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`card flex flex-col items-start p-5 text-left transition ${selected ? "border-ink ring-2 ring-ink" : "hover:border-ink/30"}`}
    >
      <span className="font-bold">{title}</span>
      <span className="mt-1 text-xs text-muted">{note}</span>
      <span className="mt-3 font-display text-2xl font-semibold">{formatAzn(price)}</span>
      <span className="text-xs text-muted">
        {formatAzn(Math.round(perDay * 100) / 100)} {m.common.perDay}
      </span>
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-success" : ""}`}>{value}</dd>
    </div>
  );
}
