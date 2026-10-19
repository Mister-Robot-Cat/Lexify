import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { fmt } from "@/lib/i18n/format";
import { adminContext } from "@/server/admin/page";
import { aiProviders, aiUsageThisMonth, loadSettings } from "@/server/admin/settings";
import { db } from "@/server/firebase-admin";

export default async function AdminSettings({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale, a } = await adminContext(params);
  const s = a.settings;
  const [settings, usage] = await Promise.all([loadSettings(), aiUsageThisMonth()]);
  const providers = aiProviders();
  const emails = await Promise.all(usage.top.map(async (r) => ((await db().collection("users").doc(r.uid).get()).data()?.email as string | undefined) ?? r.uid));
  const month = `${usage.month.slice(0, 4)}-${usage.month.slice(4)}`;

  return (
    <div className="max-w-4xl">
      <PageTitle title={a.nav.settings} hint={fmt(s.providers, { grading: providers.grading ?? s.demo, speech: providers.speech ?? s.demo })} />
      <div className="grid gap-5 lg:grid-cols-2">
        <SettingsForm initial={settings} />
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold">{fmt(s.usage, { month })}</h2>
          <p className="mt-1 text-sm text-muted">{fmt(s.usageTotal, { n: usage.total })}</p>
          {usage.top.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{s.noUsage}</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-2 font-semibold">{a.users.email}</th>
                  <th className="py-2 text-right font-semibold">{s.writing}</th>
                  <th className="py-2 text-right font-semibold">{s.speaking}</th>
                  <th className="py-2 text-right font-semibold">{s.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usage.top.map((r, i) => (
                  <tr key={r.uid}>
                    <td className="max-w-40 truncate py-2">
                      <Link href={`/${locale}/admin/users/${r.uid}`} className="underline">
                        {emails[i]}
                      </Link>
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.writing}</td>
                    <td className="py-2 text-right tabular-nums">{r.speaking}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
