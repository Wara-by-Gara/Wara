import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 인증 가드 미들웨어.
 * is_logged_in 쿠키(httpOnly: false)로 로그인 여부를 판별한다.
 *
 * ⚠️ 활성화 전 확인 사항:
 *   1. 쿠키 STEP 2 완료(dev 로그인 → is_logged_in 쿠키가 3000 도메인에 잡히는지) 확인
 *   2. 아래 matcher 주석을 해제하면 활성화
 */
export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.has("is_logged_in");

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/notifications/:path*",
    "/meetings/:path*",
    "/friends/:path*",
    "/calendar/:path*",
    "/edit/:path*",
  ],
};
