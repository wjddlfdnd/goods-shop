import { cancelOrder, OrderError } from "@/lib/order";
import { fail, memberRoute, ok } from "@/lib/api";

/** POST /api/orders/{orderNumber}/cancel — O-07: 결제 완료에서만, 409 NOT_CANCELABLE, 재고 복구 */
export async function POST(_req: Request, ctx: RouteContext<"/api/orders/[orderNumber]/cancel">) {
  return memberRoute(async (u) => {
    try {
      return ok(await cancelOrder(u.id, (await ctx.params).orderNumber));
    } catch (e) {
      if (e instanceof OrderError) return e.code === "NOT_CANCELABLE" ? fail(409, "NOT_CANCELABLE", e.message, { status: e.status }) : fail(404, "NOT_FOUND", e.message);
      throw e;
    }
  });
}
