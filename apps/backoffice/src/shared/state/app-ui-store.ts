import { create } from "zustand";

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

type AppUiState = {
  activeStore: LastStore | null;
  isMobileNavigationOpen: boolean;
  themeMode: ThemeMode;
  closeMobileNavigation: () => void;
  openMobileNavigation: () => void;
  setActiveStore: (store: LastStore | null) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleMobileNavigation: () => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  activeStore: getInitialActiveStore(),
  isMobileNavigationOpen: false,
  themeMode: getInitialThemeMode(),
  closeMobileNavigation: () => set({ isMobileNavigationOpen: false }),
  openMobileNavigation: () => set({ isMobileNavigationOpen: true }),
  setActiveStore: (store) => {
    if (store) saveLastStoreCookie(store);
    set({ activeStore: store });
  },
  setThemeMode: (themeMode) => set({ themeMode }),
  toggleMobileNavigation: () =>
    set((state) => ({
      isMobileNavigationOpen: !state.isMobileNavigationOpen,
    })),
}));
