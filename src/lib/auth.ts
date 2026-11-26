// 인증(U-01·U-02·A-01, 기술 설계서 3장): 직접 구현 세션.
// 쿠키 gs_session에는 무작위 토큰, DB Session.id에는 토큰의 SHA-256만 저장한다.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "gs_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: string; email: string; name: string; phone: string; role: "MEMBER" | "ADMIN" };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/** 로그인: 세션을 만들고 쿠키를 심는다(서버 액션·라우트 핸들러에서만 호출) */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }); // 만료 세션 정리(QA-08)
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

/** 로그아웃: DB 세션과 쿠키를 지운다 */
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** 현재 로그인한 회원(없거나 만료면 null). 요청 시점 데이터라 <Suspense> 안에서 부른다 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, phone: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

/** 이메일·비밀번호 확인. 실패 이유는 구분하지 않는다(PRD 4.2 로그인 실패) */
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return user;
}

/** 로그인 후 돌아갈 경로: 사이트 안 상대 경로만 허용(오픈 리다이렉트 방지) */
export function safeNext(next: unknown, fallback = "/") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** 관리자 권한 확인(A-01): 관리자 API·서버 액션 맨 앞에서 부른다. 회원·비회원 모두 403 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}
