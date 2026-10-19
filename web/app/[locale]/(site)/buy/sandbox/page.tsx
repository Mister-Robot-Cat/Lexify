import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { SandboxPay } from "@/components/buy/SandboxPay";
import { isLocale } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { formatAzn } from "@/lib/pricing";
import { providerById } from "@/server/payments/providers";
import { getOwnOrder } from "@/server/payments/service";
import { requireUser } from "@/server/session";

export const metadata = { robots: { index: false } };

/** Stand-in for a provider's hosted payment page (PAYMENT_PROVIDER=sandbox, not in production). */
export default async function SandboxPage({ params, searchParams }: PageProps<"/[locale]/buy/sandbox">) {
  const { locale } = await params;
  if (!isLocale(locale) || !providerById("sandbox")) notFound();
  const orderId = String((await searchParams).order ?? "");
  const user = await requireUser(locale, `/${locale}/buy/sandbox?order=${encodeURIComponent(orderId)}`);
  const order = await getOwnOrder(user.uid, orderId).catch(() => notFound());
  if (order.provider !== "sandbox") notFound();
  const m = await getMessages(locale);
  return (
    <div className="container-page flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <CreditCard className="h-10 w-10 text-amber-deep" />
        <h1 className="mt-4 font-display text-3xl font-semibold">{m.buy.sandbox.title}</h1>
        <p className="mt-2 text-sm text-muted">{m.buy.sandbox.text}</p>
        <p className="mt-6 font-display text-4xl font-semibold">{formatAzn(order.amount)}</p>
        <SandboxPay orderId={order.id} payLabel={fmt(m.buy.sandbox.pay, { amount: formatAzn(order.amount) })} failLabel={m.buy.sandbox.fail} done={`/${locale}/buy/success?order=${order.id}`} />
      </div>
    </div>
  );
}
