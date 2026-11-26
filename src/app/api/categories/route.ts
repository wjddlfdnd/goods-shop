import { connection } from "next/server";
import { listCategories } from "@/lib/catalog";

// 재고·판매 상태는 매 요청 최신이어야 하므로 캐시하지 않는다(connection()으로 요청 시점 실행).
export async function GET() {
  await connection();
  return Response.json({ data: await listCategories() });
}
