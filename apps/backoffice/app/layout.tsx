import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";

import { isThemeMode, themeCookieName } from "@/src/shared/theme/theme-cookie";

import { AppProviders } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thalya Modas Backoffice",
  description: "Local store management workspace for Thalya Modas.",
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

  return (
    <html
      lang="en"
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
