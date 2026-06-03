import { create } from "zustand";

import type {
  StoreAddressInput,
  StorePreferencesInput,
  StoreProfileInput,
} from "../domain/onboarding-schemas";

type OnboardingDraft = {
  address: StoreAddressInput;
  preferences: StorePreferencesInput;
  profile: StoreProfileInput;
};

type OnboardingStore = OnboardingDraft & {
  resetDraft: () => void;
  setAddress: (address: Partial<StoreAddressInput>) => void;
  setPreferences: (preferences: Partial<StorePreferencesInput>) => void;
  setProfile: (profile: Partial<StoreProfileInput>) => void;
};

const defaultDraft: OnboardingDraft = {
  address: {
    city: "",
    complement: "",
    country: "BR",
    neighborhood: "",
    number: "",
    state: "",
    street: "",
    zipCode: "",
  },
  preferences: {
    closingTime: "18:00",
    currency: "BRL",
    language: "pt-BR",
    openingTime: "08:00",
    timezone: "America/Fortaleza",
  },
  profile: {
    document: "",
    phone: "",
    segment: "fashion",
    storeName: "",
  },
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...defaultDraft,
  resetDraft: () => set(defaultDraft),
  setAddress: (address) =>
    set((state) => ({
      address: {
        ...state.address,
        ...address,
      },
    })),
  setPreferences: (preferences) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...preferences,
      },
    })),
  setProfile: (profile) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...profile,
      },
    })),
}));
