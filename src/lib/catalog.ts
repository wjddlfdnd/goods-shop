import { db } from "@/lib/db";

// PRD 7.9 정렬. 인기순(주문 건수, 취소 제외)은 8단계에서 집계 쿼리로 구현한다.
export type Sort = "latest" | "price_asc" | "price_desc" | "popular";
const ORDER = {
  latest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  popular: { createdAt: "desc" }, // 8단계 전까지 최신순으로 대체(PRD 7.10: 집계 0건이면 최신순)
} as const;

/** 상품 목록(P-02·P-03·P-04·P-05): 판매 중 상품만, 미분류 카테고리 제외 */
export async function listProducts(opts: { categoryId?: string; q?: string; sort?: Sort; take?: number } = {}) {
  const products = await db.product.findMany({
    where: {
      status: "ON_SALE",
      category: { isSystem: false },
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.q ? { name: { contains: opts.q.trim(), mode: "insensitive" as const } } : {}),
    },
    orderBy: [ORDER[opts.sort ?? "latest"], { createdAt: "desc" }],
    take: opts.take,
    include: {
      images: { where: { kind: "MAIN" }, take: 1 },
      options: { select: { stock: true } },
    },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.images[0]?.url ?? null,
    soldOut: p.options.every((o) => o.stock === 0),
    createdAt: p.createdAt,
  }));
}

/** 사용자 화면 카테고리(P-02): 미분류 제외 */
export function listCategories() {
  return db.category.findMany({ where: { isSystem: false }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
}

export { won } from "@/lib/format";
