import "server-only";
import { getBackofficeDestination } from "@/src/shared/auth/role-destination";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { authSessionCookieName } from "@/src/shared/auth/session-cookie";
export const requireSession = cache(async (): Promise<CurrentUser> => {
  const jar = await cookies();
  if (!jar.get(authSessionCookieName)?.value) redirect("/auth/login");
  const baseUrl =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3333";
  let user: CurrentUser | null = null;
  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { cookie: jar.toString() },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) user = await response.json();
  } catch {
    /* Fail closed when the API cannot validate the session. */
  }
  if (!user || user.accountStatus !== "ACTIVE") redirect("/auth/login");
  return user;
});

export const requireSuperAdmin = cache(async () => {
 const user=await requireSession();
 if(user.role!=="ROLE_SUPER_ADMIN") redirect(getBackofficeDestination(user.role));
 return user;
});
