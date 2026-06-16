import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 인증 가드 미들웨어 (활성).
 * 백엔드가 로그인 시 심어주는 is_logged_in 쿠키(httpOnly: false)로 로그인 여부를 판별,
 * 비로그인 사용자가 보호 라우트에 진입하면 /login?returnTo=...로 보낸다.
 *
 * 보호 범위는 개인정보성 경로로 최소화한다(아래 matcher). 초대장 열람 등 준공개 경로는
 * 페이지 단위 가드(useAuthStore)에 맡긴다.
 * 전제: is_logged_in 쿠키가 프론트 도메인에 세팅되어야 로그인 사용자가 통과한다.
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
    "/calendar/:path*",
    "/edit/:path*",
  ],
};
