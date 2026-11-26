import { connection } from "next/server";
import { listAdminOrders, parseStatus } from "@/lib/admin-orders";
import { adminRoute, ok } from "@/lib/api";

/** GET /api/admin/orders — A-06: q(주문 번호)·status·from·to(YYYY-MM-DD, 한국 날짜)·page */
export async function GET(request: Request) {
  await connection();
  return adminRoute(async () => {
    const sp = new URL(request.url).searchParams;
    return ok(await listAdminOrders({ orderNumber: sp.get("q") || undefined, status: parseStatus(sp.get("status")), from: sp.get("from") || undefined, to: sp.get("to") || undefined, page: Number(sp.get("page")) || 1 }));
  });
}
