import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";
import { getLessonList } from "@/server/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = (await getLessonList()).filter((l) => l.free);
  const paths = [
    { path: "", priority: 1 },
    { path: "/preview", priority: 0.8 },
    { path: "/welcome/diagnostic", priority: 0.8 },
    ...lessons.map((l) => ({ path: `/preview/lessons/${l.id}`, priority: 0.6 })),
    { path: "/terms", priority: 0.2 },
    { path: "/privacy", priority: 0.2 },
    { path: "/refund-policy", priority: 0.2 },
  ];
  return paths.flatMap(({ path, priority }) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
