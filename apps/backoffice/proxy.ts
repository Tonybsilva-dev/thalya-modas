import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authSessionCookieName } from "@/src/shared/auth/session-cookie";
import { localeCookieName } from "@/src/shared/i18n/locale-cookie";
import { defaultLocale, normalizeLocale } from "@/src/shared/i18n/locales";
import { lastStoreCookieName } from "@/src/shared/store/last-store-cookie";

type ApiOnboardingStep =
  | "STORE_PROFILE"
  | "STORE_ADDRESS"
  | "STORE_PREFERENCES"
  | "COMPLETED";

type OnboardingProgress = {
  status: "PENDING" | "COMPLETED";
  nextStep: ApiOnboardingStep;
  store?: {
    id: string;
    name: string;
    preferences?: {
      language?: string;
    };
  };
};

const apiBaseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

const onboardingStepPath: Record<ApiOnboardingStep, string> = {
  COMPLETED: "/onboarding/completed",
  STORE_ADDRESS: "/onboarding/address",
  STORE_PREFERENCES: "/onboarding/preferences",
  STORE_PROFILE: "/onboarding",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(authSessionCookieName)?.value;
  const isDashboardRoute = pathname.startsWith("/manager/dashboard");
  const isLoginRoute = pathname === "/auth/login" || pathname === "/login";
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!session) {
    if (isDashboardRoute || isOnboardingRoute) {
      return redirectTo(request, "/auth/login");
    }

    return NextResponse.next();
  }

  if (!isDashboardRoute && !isLoginRoute && !isOnboardingRoute) {
    return NextResponse.next();
  }

  const progress = await getOnboardingProgress(request);

  if (!progress) {
    if (isOnboardingRoute) return redirectTo(request, "/manager/dashboard");
    if (isLoginRoute) return redirectTo(request, "/manager/dashboard");
    return NextResponse.next();
  }

  const expectedPath = onboardingStepPath[progress.nextStep];

  if (progress.status === "COMPLETED") {
    if (isLoginRoute || isOnboardingRoute) {
      return withLastStore(redirectTo(request, "/manager/dashboard"), progress);
    }

    return withLastStore(NextResponse.next(), progress);
  }

  if (isDashboardRoute) {
    return withLastStore(redirectTo(request, expectedPath), progress);
  }

  if (isLoginRoute) {
    return withLastStore(redirectTo(request, expectedPath), progress);
  }

  if (isOnboardingRoute && pathname !== expectedPath) {
    return withLastStore(redirectTo(request, expectedPath), progress);
  }

  return withLastStore(NextResponse.next(), progress);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/auth/login",
    "/onboarding/:path*",
    "/manager/dashboard/:path*",
  ],
};

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  return NextResponse.redirect(url);
}

function withLastStore(response: NextResponse, progress: OnboardingProgress) {
  if (!progress.store) return response;

  const language = normalizeLocale(progress.store.preferences?.language ?? defaultLocale);

  response.cookies.set({
    name: lastStoreCookieName,
    value: JSON.stringify({
      id: progress.store.id,
      language,
      name: progress.store.name,
    }),
    maxAge: 31536000,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set({
    name: localeCookieName,
    value: language,
    maxAge: 31536000,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

async function getOnboardingProgress(
  request: NextRequest,
): Promise<OnboardingProgress | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/onboarding/me`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) return null;

    return (await response.json()) as OnboardingProgress;
  } catch {
    return null;
  }
}
