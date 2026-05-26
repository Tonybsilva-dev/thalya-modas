import { create } from "zustand";

type AppUiState = {
  isMobileNavigationOpen: boolean;
  closeMobileNavigation: () => void;
  openMobileNavigation: () => void;
  toggleMobileNavigation: () => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  isMobileNavigationOpen: false,
  closeMobileNavigation: () => set({ isMobileNavigationOpen: false }),
  openMobileNavigation: () => set({ isMobileNavigationOpen: true }),
  toggleMobileNavigation: () =>
    set((state) => ({
      isMobileNavigationOpen: !state.isMobileNavigationOpen,
    })),
}));
