import { create } from "zustand";

import { getThemeModeFromCookie, type ThemeMode } from "../theme/theme-cookie";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  return getThemeModeFromCookie(document.cookie) ?? "system";
}

type AppUiState = {
  isMobileNavigationOpen: boolean;
  themeMode: ThemeMode;
  closeMobileNavigation: () => void;
  openMobileNavigation: () => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleMobileNavigation: () => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  isMobileNavigationOpen: false,
  themeMode: getInitialThemeMode(),
  closeMobileNavigation: () => set({ isMobileNavigationOpen: false }),
  openMobileNavigation: () => set({ isMobileNavigationOpen: true }),
  setThemeMode: (themeMode) => set({ themeMode }),
  toggleMobileNavigation: () =>
    set((state) => ({
      isMobileNavigationOpen: !state.isMobileNavigationOpen,
    })),
}));
