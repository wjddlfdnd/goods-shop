import { connection } from "next/server";
import { listCategories, listProducts } from "@/lib/catalog";
import { ok } from "@/lib/api";

const BANNERS = [1, 2, 3].map((n) => ({ imageUrl: `/images/banners/banner-${n}.svg` })); // 고정 배너(D-15)

/** GET /api/home — P-01: 배너·신상품 8·인기 8(취소 제외 주문 건수, 0건이면 최신순)·카테고리 */
export async function GET() {
  await connection();
  const [newest, popular, categories] = await Promise.all([listProducts({ sort: "latest", take: 8 }), listProducts({ sort: "popular", take: 8 }), listCategories()]);
  return ok({ banners: BANNERS, newest, popular, categories });
}
