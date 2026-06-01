import { apiRequest } from "@/src/shared/api/http-client";

import type {
  StoreAddressInput,
  StorePreferencesInput,
  StoreProfileInput,
} from "../domain/onboarding-schemas";

export type ApiOnboardingStep =
  | "STORE_PROFILE"
  | "STORE_ADDRESS"
  | "STORE_PREFERENCES"
  | "COMPLETED";

export type ApiOnboardingStatus = "PENDING" | "COMPLETED";

export type OnboardingProgress = {
  status: ApiOnboardingStatus;
  nextStep: ApiOnboardingStep;
  completedSteps: ApiOnboardingStep[];
  store?: {
    id: string;
    ownerId: string;
    name: string;
    phone: string;
    document: string;
    segment: string;
    status: string;
    address?: StoreAddressInput;
    preferences?: StorePreferencesInput;
    createdAt: string;
    updatedAt: string;
  };
};

export function getOnboardingProgress() {
  return apiRequest<OnboardingProgress>("/onboarding/me");
}

export function saveStoreProfile(input: StoreProfileInput) {
  return apiRequest<OnboardingProgress>("/onboarding/store-profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function saveStoreAddress(input: StoreAddressInput) {
  return apiRequest<OnboardingProgress>("/onboarding/store-address", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function saveStorePreferences(input: StorePreferencesInput) {
  return apiRequest<OnboardingProgress>("/onboarding/preferences", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function completeOnboarding() {
  return apiRequest<OnboardingProgress>("/onboarding/complete", {
    method: "POST",
  });
}
