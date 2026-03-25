import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth", "/api/cron", "/api/test-sam"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // NextAuth v5 세션 쿠키 확인 (DB 호출 없이)
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("authjs.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp|sitemap\\.xml|robots\\.txt).*)",
  ],
};
