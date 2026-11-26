import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addToCart, CartError, cartTotal, getCart, removeCartItems } from "@/lib/cart";
import { cartFail, fail, ok, readJson } from "@/lib/api";


/** GET /api/cart — O-02: 항목 + 구매 불가 사유 + 예상 결제 금액(전체 기준) */
export async function GET() {
  await connection();
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const items = await getCart(user.id);
  return ok({ items, estimatedTotal: cartTotal(items) });
}

/** POST /api/cart — O-01: { optionId, quantity }. 같은 옵션은 합산(D-5) */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const body = (await readJson(request)) ?? {};
  try {
    const item = await addToCart(user.id, String(body.optionId ?? ""), Number(body.quantity));
    return ok(item, 201);
  } catch (e) {
    if (e instanceof CartError) return cartFail(e);
    throw e;
  }
}

/** DELETE /api/cart — O-02 선택 삭제: { itemIds: [] } */
export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const body = (await readJson(request)) ?? {};
  const ids = Array.isArray(body.itemIds) ? body.itemIds.map(String) : [];
  if (!ids.length) return fail(400, "INVALID_INPUT", "삭제할 항목을 선택해 주세요.");
  const r = await removeCartItems(user.id, ids);
  return ok({ deleted: r.count });
}
