import { advanceOrderStatus, getAdminOrder, parseStatus } from "@/lib/admin-orders";
import { adminRoute, fail, ok, readJson } from "@/lib/api";

/** PATCH /api/admin/orders/{id}/status — A-07: { next }. 다음 단계 1개만, 취소 주문 409 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/status">) {
  return adminRoute(async () => {
    const { id } = await ctx.params;
    const next = parseStatus(((await readJson(request)) ?? {}).next);
    const cur = await getAdminOrder(id);
    if (!cur) return fail(404, "NOT_FOUND", "주문을 찾을 수 없습니다.");
    if (!next) return fail(400, "INVALID_INPUT", "바꿀 상태를 알려 주세요.");
    return ok(await advanceOrderStatus(id, cur.status, next));
  });
}
