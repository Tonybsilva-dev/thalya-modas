"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { getDocumentLang, getMessages } from "@/src/shared/i18n/messages";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { ThemeController } from "@/src/shared/theme/theme-controller";

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useAppUiStore((state) => state.locale);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  useEffect(() => {
    document.documentElement.lang = getDocumentLang(locale);
  }, [locale]);

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={getMessages(locale)}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeController />
          {children}
        </NuqsAdapter>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
