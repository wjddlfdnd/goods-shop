// 상품 탐색 조회(P-01–P-07). 사용자 화면은 판매 중 상품만, 미분류(시스템 카테고리)는 노출하지 않는다(D-12).
import { db } from "@/lib/db";

/** LIKE 검색어 이스케이프: Prisma contains는 %·_를 와일드카드로 넘긴다(QA-04). "_"만 쳐도 전체가 나오던 문제 */
export const likeText = (q: string) => q.trim().replace(/[\\%_]/g, (c) => `\\${c}`);

export type Sort = "latest" | "price_asc" | "price_desc" | "popular";
export const SORTS: { value: Sort; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price_asc", label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
];
export const sortLabel = (s: Sort) => SORTS.find((x) => x.value === s)?.label ?? "최신순";
export const parseSort = (v: unknown): Sort => (SORTS.some((s) => s.value === v) ? (v as Sort) : "latest");

/** NEW 라벨: 등록 14일 이내(가정, LEDGER #98) */
const NEW_DAYS = 14;
export const isNew = (createdAt: Date) => Date.now() - createdAt.getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;

/** 인기 집계(D-3, 7.9): 상품별로 그 상품을 1개 이상 담은 주문 중 주문 취소가 아닌 주문 수 */
export async function orderCounts(): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<{ productId: string; n: bigint }[]>`
    SELECT oi."productId", COUNT(DISTINCT oi."orderId") AS n
    FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
    WHERE o.status <> 'CANCELED'
    GROUP BY oi."productId"`;
  return new Map(rows.map((r) => [r.productId, Number(r.n)]));
}

export type ProductSummary = { id: string; name: string; price: number; imageUrl: string | null; soldOut: boolean; createdAt: Date; isNew: boolean; orders?: number };

/** 상품 목록(P-02·P-03·P-04·P-05): 판매 중 상품만, 미분류 제외 */
export async function listProducts(opts: { categoryId?: string; q?: string; sort?: Sort; take?: number } = {}): Promise<ProductSummary[]> {
  const sort = opts.sort ?? "latest";
  const products = await db.product.findMany({
    where: {
      status: "ON_SALE",
      category: { isSystem: false },
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.q ? { name: { contains: likeText(opts.q), mode: "insensitive" as const } } : {}),
    },
    orderBy:
      sort === "price_asc" ? [{ price: "asc" }, { createdAt: "desc" }]
      : sort === "price_desc" ? [{ price: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }],
    take: sort === "popular" ? undefined : opts.take,
    include: { images: { where: { kind: "MAIN" }, orderBy: { sortOrder: "asc" }, take: 1 }, options: { select: { stock: true } } },
  });
  let list: ProductSummary[] = products.map((p) => ({
    id: p.id, name: p.name, price: p.price, imageUrl: p.images[0]?.url ?? null,
    soldOut: p.options.every((o) => o.stock === 0), createdAt: p.createdAt, isNew: isNew(p.createdAt),
  }));
  if (sort === "popular") {
    // 동률이면 최신순(이미 최신순으로 정렬돼 있으므로 안정 정렬). 주문 0건이면 결과는 최신순과 같다(7.10).
    const counts = await orderCounts();
    list = list.map((p) => ({ ...p, orders: counts.get(p.id) ?? 0 })).sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0));
    if (opts.take) list = list.slice(0, opts.take);
  }
  return list;
}

/** 사용자 화면 카테고리(P-02): 미분류 제외, 정렬 순서대로 */
export function listCategories() {
  return db.category.findMany({ where: { isSystem: false }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
}

export function getCategory(id: string) {
  return db.category.findFirst({ where: { id, isSystem: false }, select: { id: true, name: true } });
}

/** 상품 상세(P-06·P-07): 판매 중지 상품도 조회된다(직접 URL·장바구니에서 진입) */
export async function getProduct(id: string) {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, isSystem: true } },
      images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] },
      options: { orderBy: [{ sortOrder: "asc" }] },
    },
  });
  if (!p) return null;
  return {
    id: p.id, name: p.name, price: p.price, description: p.description, status: p.status, isNew: isNew(p.createdAt),
    category: p.category,
    images: p.images.map((i) => ({ url: i.url, kind: i.kind })),
    options: p.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extraPrice, stock: o.stock, isDefault: o.isDefault })),
  };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export { won } from "@/lib/format";
