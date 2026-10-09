import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Duplicated from `src/constants/auth.ts` on purpose.
 * Proxy runs separately from the app bundle and should not import it.
 */
const ACCESS_COOKIE = "om_access";
const REFRESH_COOKIE = "om_refresh";

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSession(request);
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/meetings");

  if (isProtected && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/meetings/:path*", "/login", "/signup"],
};
