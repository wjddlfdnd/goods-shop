import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrder } from "@/lib/order";
import { fail, ok } from "@/lib/api";

/** GET /api/orders/{orderNumber} — O-06 주문 완료 정보(본인만, 남의 주문은 404) */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[orderNumber]">) {
  await connection();
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const order = await getOrder(user.id, (await ctx.params).orderNumber);
  if (!order) return fail(404, "NOT_FOUND", "주문을 찾을 수 없습니다.");
  return ok(order);
}
