import { redirect } from "next/navigation";

export default async function SkillIndex({ params }: PageProps<"/[locale]/app/[skill]">) {
  const { locale, skill } = await params;
  redirect(`/${locale}/app/${skill}/lessons`);
}
