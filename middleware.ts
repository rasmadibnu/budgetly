import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySignedSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await verifySignedSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const hasSession = Boolean(session);
  const isAuthRoute = pathname.startsWith("/login");

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"]
};
