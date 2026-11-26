import { getSessionUser } from "@/lib/auth";
import { OrderError, placeOrder, type CheckoutSource } from "@/lib/order";
import { fieldErrors, orderFieldsSchema } from "@/lib/validation";
import { fail, ok, readJson } from "@/lib/api";

/** POST /api/orders — O-04·O-05 모의 결제. 같은 idempotencyKey 재요청은 같은 주문(200) */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const b = (await readJson(request)) ?? {};
  const parsed = orderFieldsSchema.safeParse(b);
  const src = b.items as Record<string, unknown> | undefined;
  const source: CheckoutSource | null = Array.isArray(b.itemIds) ? { from: "cart", itemIds: b.itemIds.map(String) }
    : src && typeof src === "object" ? { from: "buy", optionId: String(src.optionId ?? ""), quantity: Number(src.quantity) } : null;
  const fields = parsed.success ? {} : fieldErrors(parsed.error);
  if (!source) fields.items = "주문할 상품이 없습니다.";
  if (!parsed.success || !source) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields });
  try {
    const r = await placeOrder(user.id, { ...parsed.data, source, saveAsDefault: b.saveAsDefault === true });
    return ok({ orderNumber: r.orderNumber }, r.duplicate ? 200 : 201);
  } catch (e) {
    if (e instanceof OrderError) {
      if (e.code === "OUT_OF_STOCK") return fail(409, "OUT_OF_STOCK", e.message, { items: e.items });
      if (e.code === "UNAVAILABLE") return fail(409, "UNAVAILABLE", e.message);
      return fail(400, e.code, e.message);
    }
    console.error(e);
    return fail(500, "SERVER_ERROR", "결제를 처리하지 못했습니다. 다시 시도해 주세요.");
  }
}
