import { connection } from "next/server";
import { salesSummary } from "@/lib/admin-orders";
import { adminRoute, ok } from "@/lib/api";

/** GET /api/admin/summary — A-08: 주문 수·매출(취소 제외)·판매 중 상품 수 */
export async function GET() {
  await connection();
  return adminRoute(async () => ok(await salesSummary()));
}
