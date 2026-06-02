import { defaultLocale, normalizeLocale, type AppLocale } from "../i18n/locales";

export type LastStore = {
  id: string;
  language: AppLocale;
  name: string;
};

export const lastStoreCookieName = "@store-flow:last-store";

export function getLastStoreFromCookie(cookieSource: string): LastStore | null {
  const cookieValue = cookieSource
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${lastStoreCookieName}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!cookieValue) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as Partial<LastStore>;
    if (!parsed.id || !parsed.name) return null;

    return {
      id: parsed.id,
      language: normalizeLocale(parsed.language),
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

export function serializeLastStoreCookie(store: LastStore) {
  return [
    `${lastStoreCookieName}=${encodeURIComponent(
      JSON.stringify({
        id: store.id,
        language: store.language ?? defaultLocale,
        name: store.name,
      }),
    )}`,
    "Path=/",
    "Max-Age=31536000",
    "SameSite=Lax",
  ].join("; ");
}

export function saveLastStoreCookie(store: LastStore) {
  document.cookie = serializeLastStoreCookie(store);
}
