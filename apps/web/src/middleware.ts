// Auth gate for the WHC Editor — only signed-in WHC team members reach the
// editor surfaces. Auth.js cookie presence is the pass-through check; the
// signIn callback in src/auth.ts is what enforces the Users allow-list at
// sign-in time, so any cookie present here is already gated.
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/api/auth",
  "/api/health",
  "/favicon.ico",
  "/manifest.json",
];

const AUTHJS_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/fonts")) {
    return NextResponse.next();
  }

  const hasSession = AUTHJS_COOKIES.some((c) => req.cookies.get(c)?.value);
  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
