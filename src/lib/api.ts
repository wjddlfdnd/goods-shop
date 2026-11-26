import type { CartError } from "@/lib/cart";
import { requireAdmin } from "@/lib/auth";
import { AdminError } from "@/lib/admin";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { AccountError } from "@/lib/account";
// API 공통 응답 형식(기술 설계서 7장): 성공 { data }, 실패 { error, message }
export const ok = (data: unknown, status = 200) => Response.json({ data }, { status });
export const fail = (status: number, error: string, message: string, extra?: Record<string, unknown>) =>
  Response.json({ error, message, ...extra }, { status });

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try { const v = await request.json(); return v && typeof v === "object" ? v : null; } catch { return null; }
}

const CART_STATUS = { NOT_FOUND: 404, UNAVAILABLE: 409, SOLD_OUT: 409, OVER_STOCK: 409, INVALID_QUANTITY: 400 } as const;
/** 장바구니 오류 → API 응답(API 명세: 409 OVER_STOCK(남은 수량), 409 UNAVAILABLE) */
export const cartFail = (e: CartError) =>
  fail(CART_STATUS[e.code], e.code === "SOLD_OUT" ? "UNAVAILABLE" : e.code, e.message, e.remaining != null ? { remaining: e.remaining } : undefined);

/** 관리자 API 공통: 권한 확인(회원·비회원 403)과 AdminError → 응답 */
export async function adminRoute(fn: () => Promise<Response>): Promise<Response> {
  if (!(await requireAdmin())) return fail(403, "FORBIDDEN", "관리자만 사용할 수 있습니다.");
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AdminError) return fail(e.status, e.code, e.message, e.extra);
    throw e;
  }
}

/** 로그인한 회원 API 공통: 401과 AccountError → 응답 */
export async function memberRoute(fn: (user: SessionUser) => Promise<Response>): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  try {
    return await fn(user);
  } catch (e) {
    if (e instanceof AccountError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
