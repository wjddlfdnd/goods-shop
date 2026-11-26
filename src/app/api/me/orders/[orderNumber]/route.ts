import { connection } from "next/server";
import { getOrder } from "@/lib/order";
import { fail, memberRoute, ok } from "@/lib/api";

/** GET /api/me/orders/{orderNumber} — U-05 주문 상세(D-4). 남의 주문 404 */
export async function GET(_req: Request, ctx: RouteContext<"/api/me/orders/[orderNumber]">) {
  await connection();
  return memberRoute(async (u) => {
    const o = await getOrder(u.id, (await ctx.params).orderNumber);
    return o ? ok(o) : fail(404, "NOT_FOUND", "주문을 찾을 수 없습니다.");
  });
}
