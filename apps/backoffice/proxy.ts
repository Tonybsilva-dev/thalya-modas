import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authSessionCookieName } from "@/src/shared/auth/session-cookie";
import { getBackofficeDestination, roleSegments } from "@/src/shared/auth/role-destination";
const apiBaseUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/auth/login" || pathname === "/login" || pathname === "/auth/register";
  const isBackoffice =
    pathname === "/backoffice" || pathname.startsWith("/backoffice/");
  const isLegacy =
    /^\/[^/]+\/dashboard(?:\/|$)/.test(pathname) ||
    pathname.startsWith("/onboarding");
  const protectedRoute = isBackoffice || isLegacy || ["/admin","/manager","/employee","/customer","/unauthorized"].includes(pathname);
  const session = request.cookies.get(authSessionCookieName)?.value;
  if (!session)
    return protectedRoute
      ? redirectTo(request, "/auth/login")
      : NextResponse.next();
  let user: { role: string; accountStatus: string; entryDestination?: string } | null = null;
  try {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) user = await response.json();
  } catch {
    /* An unavailable session never grants access. */
  }
  if (!user || user.accountStatus !== "ACTIVE") {
    const response = protectedRoute
      ? redirectTo(request, "/auth/login")
      : NextResponse.next();
    response.cookies.delete(authSessionCookieName);
    return response;
  }
  const destination = getBackofficeDestination(user.role);
  if (user.role === "ROLE_ADMIN" && user.entryDestination?.startsWith("/onboarding")) {
    if (pathname === user.entryDestination) return NextResponse.next();
    return redirectTo(request, user.entryDestination);
  }
  if (pathname === "/unauthorized" && destination === "/unauthorized") return NextResponse.next();
  const segment = pathname.split("/")[1];
  if (isLegacy && !pathname.startsWith("/onboarding")) {
    const ownSegment = roleSegments[user.role];
    if (segment === ownSegment && ownSegment !== "backoffice" && (ownSegment !== "customer" || pathname === "/customer/dashboard")) return NextResponse.next();
    return redirectTo(request,destination);
  }
  if (isLogin || pathname === "/" || isLegacy || pathname === "/unauthorized" || ["/admin","/manager","/employee","/customer"].includes(pathname))
    return redirectTo(request, destination);
  if (isBackoffice && destination !== "/backoffice")
    return redirectTo(request, destination);
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/",
    "/admin", "/manager", "/employee", "/customer", "/unauthorized",
    "/login",
    "/auth/login",
    "/auth/register",
    "/backoffice/:path*",
    "/onboarding/:path*",
    "/:role/dashboard/:path*",
  ],
};
function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}
