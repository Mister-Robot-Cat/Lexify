import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

/** Shown on pages that need Firebase before the project has been configured. */
export async function FirebaseMissing({ locale }: { locale: Locale }) {
  const m = await getMessages(locale);
  return (
    <div className="container-page py-20">
      <p className="mx-auto max-w-lg rounded-2xl border border-amber/40 bg-amber-soft p-6 text-center text-amber-deep">{m.auth.notConfigured}</p>
    </div>
  );
}
