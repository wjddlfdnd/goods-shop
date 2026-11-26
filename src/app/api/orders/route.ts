import { getSessionUser } from "@/lib/auth";
import { OrderError, placeOrder, type CheckoutSource } from "@/lib/order";
import { phoneSchema } from "@/lib/validation";
import { fail, ok, readJson } from "@/lib/api";

const PAY = ["CARD", "TRANSFER", "EASY_PAY"] as const;

/** POST /api/orders — O-04·O-05 모의 결제. 같은 idempotencyKey 재요청은 같은 주문(200) */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const b = (await readJson(request)) ?? {};
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const fields: Record<string, string> = {};
  for (const k of ["ordererName", "recipient", "address1", "idempotencyKey"]) if (!str(k)) fields[k] = "필수 입력입니다.";
  for (const k of ["ordererPhone", "recipientPhone"]) if (!phoneSchema.safeParse(str(k)).success) fields[k] = "연락처는 숫자 10–11자리로 입력해 주세요.";
  if (!PAY.includes(b.paymentMethod as never)) fields.paymentMethod = "결제 수단을 선택해 주세요.";
  const src = b.items as Record<string, unknown> | undefined;
  const source: CheckoutSource | null = Array.isArray(b.itemIds) ? { from: "cart", itemIds: b.itemIds.map(String) }
    : src && typeof src === "object" ? { from: "buy", optionId: String(src.optionId ?? ""), quantity: Number(src.quantity) } : null;
  if (!source) fields.items = "주문할 상품이 없습니다.";
  if (Object.keys(fields).length) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields });
  try {
    const r = await placeOrder(user.id, {
      idempotencyKey: str("idempotencyKey"), source: source!, paymentMethod: b.paymentMethod as (typeof PAY)[number],
      ordererName: str("ordererName"), ordererPhone: str("ordererPhone"), recipient: str("recipient"), recipientPhone: str("recipientPhone"),
      address1: str("address1"), address2: str("address2"), requestNote: str("requestNote"), saveAsDefault: b.saveAsDefault === true,
    });
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
