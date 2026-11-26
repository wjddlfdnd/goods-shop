import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { checkoutLines, checkoutPrefill, type CheckoutSource } from "@/lib/order";
import { fail, ok, readJson } from "@/lib/api";

/** POST /api/checkout — O-03·O-04: { from: "cart", itemIds } 또는 { from: "buy", optionId, quantity } → 주문서 데이터 + idempotencyKey + 미리 채움 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const b = (await readJson(request)) ?? {};
  const source: CheckoutSource | null = b.from === "cart" && Array.isArray(b.itemIds) ? { from: "cart", itemIds: b.itemIds.map(String) }
    : b.from === "buy" ? { from: "buy", optionId: String(b.optionId ?? ""), quantity: Number(b.quantity) } : null;
  if (!source) return fail(400, "INVALID_INPUT", "주문할 상품을 알려 주세요.");
  const items = await checkoutLines(user.id, source);
  if (!items.length) return fail(400, "EMPTY", "주문할 상품이 없습니다.");
  const prefill = await checkoutPrefill(user.id);
  return ok({ items, total: items.reduce((s, l) => s + l.unitPrice * l.quantity, 0), idempotencyKey: randomUUID(), orderer: prefill.orderer, defaultAddress: prefill.address });
}
