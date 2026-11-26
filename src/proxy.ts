// 요청 앞단 접근 확인(A-01·U-02, 기술 설계서 3장). 쿠키 유무만 빠르게 보고, 역할·만료는 화면이 다시 확인한다.
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "gs_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.cookies.has(SESSION_COOKIE) || pathname === "/admin/login") return NextResponse.next(); // 관리자 로그인 화면(A-01 2차)은 누구나
  if (pathname.startsWith("/admin")) {
    // 회원·비회원 같은 처리: 사용자 홈 + "관리자만 들어갈 수 있는 페이지입니다"(PRD v1.3)
    return NextResponse.redirect(new URL("/?notice=admin-only", request.url));
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/account/:path*", "/orders/:path*"],
};
