import { connection } from "next/server";
import { listMyOrders } from "@/lib/order";
import { memberRoute, ok } from "@/lib/api";

/** GET /api/me/orders — U-05: 본인 주문만, 주문일 내림차순 */
export async function GET() {
  await connection();
  return memberRoute(async (u) => ok(await listMyOrders(u.id)));
}
