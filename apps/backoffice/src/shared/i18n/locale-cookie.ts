import { defaultLocale, isAppLocale, type AppLocale } from "./locales";

export const localeCookieName = "@store-flow:locale";

export function getLocaleFromCookie(cookieSource: string): AppLocale | null {
  const cookieValue = cookieSource
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${localeCookieName}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!cookieValue) return null;

  try {
    const decodedValue = decodeURIComponent(cookieValue);
    return isAppLocale(decodedValue) ? decodedValue : null;
  } catch {
    return null;
  }
}

export function serializeLocaleCookie(locale: AppLocale = defaultLocale) {
  return [
    `${localeCookieName}=${encodeURIComponent(locale)}`,
    "Path=/",
    "Max-Age=31536000",
    "SameSite=Lax",
  ].join("; ");
}

export function saveLocaleCookie(locale: AppLocale) {
  document.cookie = serializeLocaleCookie(locale);
}
