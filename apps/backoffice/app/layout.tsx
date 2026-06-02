import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";

import { isThemeMode, themeCookieName } from "@/src/shared/theme/theme-cookie";
import { appConfig } from "@/src/shared/config/app";
import { localeCookieName } from "@/src/shared/i18n/locale-cookie";
import { getDocumentLang } from "@/src/shared/i18n/messages";
import { defaultLocale, normalizeLocale } from "@/src/shared/i18n/locales";
import { getLastStoreFromCookie } from "@/src/shared/store/last-store-cookie";

import { AppProviders } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${appConfig.name} Backoffice`,
  description: "Area de trabalho para gestao de loja local.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedThemeMode = cookieStore.get(themeCookieName)?.value;
  const themeMode = isThemeMode(storedThemeMode) ? storedThemeMode : "system";
  const themeClassName = themeMode === "dark" ? " dark" : "";
  const cookieHeader = cookieStore.toString();
  const lastStore = getLastStoreFromCookie(cookieHeader);
  const locale = normalizeLocale(
    cookieStore.get(localeCookieName)?.value ?? lastStore?.language ?? defaultLocale,
  );

  return (
    <html
      lang={getDocumentLang(locale)}
      className={`${spaceGrotesk.variable} h-full antialiased${themeClassName}`}
      data-theme={themeMode}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
