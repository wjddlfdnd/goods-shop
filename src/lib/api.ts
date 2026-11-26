import type { CartError } from "@/lib/cart";
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
