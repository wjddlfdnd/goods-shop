import { connection } from "next/server";
import { getProduct } from "@/lib/catalog";
import { fail, ok } from "@/lib/api";

/** GET /api/products/{id} — P-06·P-07. 판매 중지 상품도 조회된다 */
export async function GET(_req: Request, ctx: RouteContext<"/api/products/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const p = await getProduct(id);
  if (!p) return fail(404, "NOT_FOUND", "상품을 찾을 수 없습니다");
  const { category, ...rest } = p;
  return ok({ ...rest, category: category.isSystem ? null : { id: category.id, name: category.name }, options: p.options.map((o) => ({ ...o, soldOut: o.stock === 0 })) });
}
