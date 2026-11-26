// 찜(U-06, 2차, Could Have). 회원·상품 조합은 1건(Wishlist PK). 비회원은 로그인 후 이어서 찜(D-13)
import { db } from "@/lib/db";

export class WishError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function addWish(userId: string, productId: string) {
  const p = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!p) throw new WishError(404, "NOT_FOUND", "상품을 찾을 수 없습니다.");
  // 이미 찜했으면 그대로(같은 조합 1건). 동시 요청도 PK 충돌 없이 처리
  await db.$executeRaw`INSERT INTO "Wishlist" ("userId", "productId") VALUES (${userId}, ${productId}) ON CONFLICT DO NOTHING`;
}

export async function removeWish(userId: string, productId: string) {
  await db.wishlist.deleteMany({ where: { userId, productId } });
}

/** 다시 누르면 삭제(U-06): 찜 상태를 뒤집고 새 상태를 돌려준다 */
export async function toggleWish(userId: string, productId: string): Promise<boolean> {
  const has = await db.wishlist.findUnique({ where: { userId_productId: { userId, productId } } });
  if (has) { await removeWish(userId, productId); return false; }
  await addWish(userId, productId);
  return true;
}

export async function wishedIds(userId: string | undefined | null): Promise<Set<string>> {
  if (!userId) return new Set();
  return new Set((await db.wishlist.findMany({ where: { userId }, select: { productId: true } })).map((w) => w.productId));
}

/** 찜 목록: 최근 찜한 순. 판매 중지·품절 상품도 보여 주되 상태를 표시한다 */
export async function listWishlist(userId: string) {
  const rows = await db.wishlist.findMany({
    where: { userId }, orderBy: { createdAt: "desc" },
    include: { product: { include: { images: { where: { kind: "MAIN" }, take: 1 }, options: { select: { stock: true } }, category: { select: { isSystem: true } } } } },
  });
  return rows.map(({ product: p }) => ({
    id: p.id, name: p.name, price: p.price, imageUrl: p.images[0]?.url ?? null,
    stopped: p.status !== "ON_SALE", soldOut: p.options.every((o) => o.stock === 0),
  }));
}
