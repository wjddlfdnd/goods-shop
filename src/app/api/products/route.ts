import { connection } from "next/server";
import { z } from "zod";
import { listProducts } from "@/lib/catalog";

const Query = z.object({
  category: z.string().min(1).optional(),
  q: z.string().optional(),
  sort: z.enum(["latest", "price_asc", "price_desc", "popular"]).default("latest"),
});

/** GET /api/products?category=&q=&sort= — P-02–P-05 */
// 재고·판매 상태는 매 요청 최신이어야 하므로 캐시하지 않는다(connection()으로 요청 시점 실행).
export async function GET(request: Request) {
  await connection();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = Query.safeParse(params);
  if (!parsed.success) return Response.json({ error: "INVALID_QUERY" }, { status: 400 });
  const { category, q, sort } = parsed.data;
  // P-05: 빈 검색어·공백뿐이면 검색하지 않는다
  if (q !== undefined && q.trim() === "") return Response.json({ error: "EMPTY_QUERY", message: "검색어를 입력해 주세요" }, { status: 400 });
  return Response.json({ data: await listProducts({ categoryId: category, q, sort }) });
}
