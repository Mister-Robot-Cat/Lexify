export const locales = ["az", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";
export const LOCALE_COOKIE = "lx_locale";

export const localeNames: Record<Locale, string> = {
  az: "Azərbaycanca",
  en: "English",
  ru: "Русский",
};

export const localeShort: Record<Locale, string> = {
  az: "AZ",
  en: "EN",
  ru: "RU",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Text stored in Firestore for several languages; English is the fallback. */
export type Localized = Partial<Record<Locale, string>> & { en: string };

export function pick(text: Localized | string | undefined, locale: Locale): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale] || text.en;
}
