import { notFound } from "next/navigation";
import { PracticeList } from "@/components/cabinet/PracticeList";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { isSkill } from "@/lib/types";
import { practiceCards } from "@/server/practice/service";
import { requireUser } from "@/server/session";

export default async function PracticePage({ params }: PageProps<"/[locale]/app/[skill]/practice">) {
  const { locale, skill } = await params;
  if (!isLocale(locale) || !isSkill(skill)) notFound();
  const user = await requireUser(locale, `/${locale}/app/${skill}/practice`);
  const [m, cards] = await Promise.all([getMessages(locale), practiceCards(user.uid, skill)]);
  const p = m.cabinet.practice;
  if (!cards.length) return <p className="text-muted">{p.empty}</p>;
  const exercises = cards.filter((c) => c.kind === "exercise");
  const mocks = cards.filter((c) => c.kind === "mock");
  return (
    <div className="space-y-10">
      {exercises.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">{p.exercises}</h2>
          <p className="mb-4 text-sm text-muted">{p.exercisesText}</p>
          <PracticeList skill={skill} cards={exercises} />
        </section>
      )}
      {mocks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">{p.mocks}</h2>
          <p className="mb-4 text-sm text-muted">{p.mocksText}</p>
          <PracticeList skill={skill} cards={mocks} />
        </section>
      )}
    </div>
  );
}
