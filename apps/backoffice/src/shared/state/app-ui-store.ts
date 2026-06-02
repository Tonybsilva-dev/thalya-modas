import { create } from "zustand";

import {
  getLocaleFromCookie,
  saveLocaleCookie,
} from "../i18n/locale-cookie";
import { defaultLocale, type AppLocale } from "../i18n/locales";
import {
  getLastStoreFromCookie,
  saveLastStoreCookie,
  type LastStore,
} from "../store/last-store-cookie";
import { getThemeModeFromCookie, type ThemeMode } from "../theme/theme-cookie";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  return getThemeModeFromCookie(document.cookie) ?? "system";
}

function getInitialActiveStore(): LastStore | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getLastStoreFromCookie(document.cookie);
}

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const storedLocale = getLocaleFromCookie(document.cookie);
  if (storedLocale) return storedLocale;

  return getInitialActiveStore()?.language ?? defaultLocale;
}

type AppUiState = {
  activeStore: LastStore | null;
  isMobileNavigationOpen: boolean;
  locale: AppLocale;
  themeMode: ThemeMode;
  closeMobileNavigation: () => void;
  openMobileNavigation: () => void;
  setActiveStore: (store: LastStore | null) => void;
  setLocale: (locale: AppLocale) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleMobileNavigation: () => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  activeStore: getInitialActiveStore(),
  isMobileNavigationOpen: false,
  locale: getInitialLocale(),
  themeMode: getInitialThemeMode(),
  closeMobileNavigation: () => set({ isMobileNavigationOpen: false }),
  openMobileNavigation: () => set({ isMobileNavigationOpen: true }),
  setActiveStore: (store) => {
    if (store) saveLastStoreCookie(store);
    set({
      activeStore: store,
      locale: store?.language ?? getInitialLocale(),
    });
  },
  setLocale: (locale) => {
    saveLocaleCookie(locale);
    set({ locale });
  },
  setThemeMode: (themeMode) => set({ themeMode }),
  toggleMobileNavigation: () =>
    set((state) => ({
      isMobileNavigationOpen: !state.isMobileNavigationOpen,
    })),
}));
