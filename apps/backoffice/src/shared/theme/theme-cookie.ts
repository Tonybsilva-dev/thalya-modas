export type ThemeMode = "light" | "dark" | "system";

export const themeCookieName = "@thalya-modas:theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getThemeModeFromCookie(cookieSource: string): ThemeMode | null {
  const cookieValue = cookieSource
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${themeCookieName}=`))
    ?.split("=")[1];

  const decodedValue = cookieValue ? decodeURIComponent(cookieValue) : null;

  return isThemeMode(decodedValue) ? decodedValue : null;
}

export function serializeThemeModeCookie(themeMode: ThemeMode) {
  const maxAge = 60 * 60 * 24 * 365;

  return `${themeCookieName}=${encodeURIComponent(
    themeMode,
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
