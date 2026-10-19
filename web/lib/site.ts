import type { Locale } from "@/lib/i18n/config";

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

/** Replace with your real profiles; empty links are hidden. */
export const SOCIAL_LINKS: { id: "instagram" | "telegram" | "youtube" | "tiktok"; label: string; href: string }[] = [
  { id: "instagram", label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://instagram.com/" },
  { id: "telegram", label: "Telegram", href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM || "https://t.me/" },
  { id: "youtube", label: "YouTube", href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "https://youtube.com/" },
  { id: "tiktok", label: "TikTok", href: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || "https://tiktok.com/" },
];

export function localePath(locale: Locale, path = ""): string {
  return `/${locale}${path === "/" ? "" : path}`;
}
