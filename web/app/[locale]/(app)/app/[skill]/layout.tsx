import { notFound } from "next/navigation";
import { SkillTabs } from "@/components/cabinet/SkillTabs";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { isSkill } from "@/lib/types";

export default async function SkillLayout({ children, params }: LayoutProps<"/[locale]/app/[skill]">) {
  const { locale, skill } = await params;
  if (!isLocale(locale) || !isSkill(skill)) notFound();
  const m = await getMessages(locale);
  const c = skillColor[skill];
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: c.soft, color: c.fg }}>
          <SkillIcon skill={skill} className="h-6 w-6" />
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{m.common.skills[skill]}</h1>
      </div>
      <SkillTabs skill={skill} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
