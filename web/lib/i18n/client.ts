import { LOCALE_COOKIE, type Locale } from "./config";

/** Remembers the language for guests and tells the server to save it for signed-in users. */
export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  fetch("/api/me/locale", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ locale }),
  }).catch(() => {});
}
