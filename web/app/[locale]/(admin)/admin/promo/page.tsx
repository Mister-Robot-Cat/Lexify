import { PageTitle } from "@/components/admin/PageTitle";
import { PromoManager } from "@/components/admin/PromoManager";
import { pick } from "@/lib/i18n/config";
import { PAYMENTS_ENABLED } from "@/lib/pricing";
import { allCourses } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";
import { listPromos } from "@/server/admin/payments";

export default async function AdminPromo({ params }: PageProps<"/[locale]/admin/promo">) {
  const { locale, a } = await adminContext(params);
  const [rows, courses] = await Promise.all([listPromos(), allCourses()]);
  return (
    <>
      <PageTitle title={a.nav.promo} hint={PAYMENTS_ENABLED ? undefined : a.promo.paymentsOff} />
      <PromoManager rows={rows} courses={courses.map((c) => ({ id: c.id, title: pick(c.title, locale) }))} />
    </>
  );
}
