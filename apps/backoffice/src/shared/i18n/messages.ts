import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";

import { defaultLocale, normalizeLocale, type AppLocale } from "./locales";

export const messages = {
  "pt-BR": ptBR,
  en,
  es,
} as const;

export type AppMessages = (typeof messages)[typeof defaultLocale];

export function getMessages(locale: unknown): AppMessages {
  return messages[normalizeLocale(locale)];
}

export function getDocumentLang(locale: AppLocale) {
  return locale === "pt-BR" ? "pt-BR" : locale;
}
