import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "chatcraft_session";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (!hasSession && (pathname.startsWith("/chat") || pathname.startsWith("/profile"))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/profile/:path*"],
};
