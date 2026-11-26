import { connection } from "next/server";
import { getAdminOrder } from "@/lib/admin-orders";
import { adminRoute, fail, ok } from "@/lib/api";

/** GET /api/admin/orders/{id} — A-06 주문 상세 */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  await connection();
  return adminRoute(async () => {
    const o = await getAdminOrder((await ctx.params).id);
    return o ? ok(o) : fail(404, "NOT_FOUND", "주문을 찾을 수 없습니다.");
  });
}
