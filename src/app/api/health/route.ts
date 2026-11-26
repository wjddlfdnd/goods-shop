import { connection } from "next/server";
import { db } from "@/lib/db";

/** 상태 확인: DB 연결과 기본 데이터 수 */
// 재고·판매 상태는 매 요청 최신이어야 하므로 캐시하지 않는다(connection()으로 요청 시점 실행).
export async function GET() {
  await connection();
  const [products, categories] = await Promise.all([db.product.count(), db.category.count()]);
  return Response.json({ ok: true, products, categories });
}
