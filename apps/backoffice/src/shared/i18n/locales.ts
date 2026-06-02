export const defaultLocale = "pt-BR";

export const supportedLocales = ["pt-BR", "en", "es"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && supportedLocales.includes(value as AppLocale);
}

export function normalizeLocale(value: unknown): AppLocale {
  if (isAppLocale(value)) return value;
  if (value === "en-US" || value === "en-GB") return "en";
  if (value === "es-ES" || value === "es-MX") return "es";

  return defaultLocale;
}
