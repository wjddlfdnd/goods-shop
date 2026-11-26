// 장바구니(O-01·O-02, PRD 7.3). 장바구니는 재고를 선점하지 않는다(D-11). 금액은 서버가 다시 계산한다(7.4).
import { db } from "@/lib/db";

export class CartError extends Error {
  constructor(public code: "NOT_FOUND" | "UNAVAILABLE" | "SOLD_OUT" | "OVER_STOCK" | "INVALID_QUANTITY", message: string, public remaining?: number) {
    super(message);
  }
}

/** 담기(O-01): 같은 옵션은 기존 수량에 합산(D-5). 합산 수량이 현재 재고를 넘으면 거부 */
export async function addToCart(userId: string, optionId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new CartError("INVALID_QUANTITY", "수량은 1 이상이어야 합니다.");
  return db.$transaction(async (tx) => {
    const option = await tx.productOption.findUnique({ where: { id: optionId }, include: { product: { select: { status: true } } } });
    if (!option) throw new CartError("NOT_FOUND", "상품을 찾을 수 없습니다");
    if (option.product.status !== "ON_SALE") throw new CartError("UNAVAILABLE", "판매가 중지된 상품은 담을 수 없습니다.");
    if (option.stock === 0) throw new CartError("SOLD_OUT", "품절된 옵션은 담을 수 없습니다.", 0);
    const existing = await tx.cartItem.findUnique({ where: { userId_optionId: { userId, optionId } } });
    const total = (existing?.quantity ?? 0) + quantity;
    if (total > option.stock) {
      const msg = existing
        ? `장바구니에 이미 ${existing.quantity}개가 있어 ${quantity}개를 더 담을 수 없습니다. 남은 재고는 ${option.stock}개입니다.`
        : `재고가 ${option.stock}개 남아 있어 ${quantity}개를 담을 수 없습니다.`;
      throw new CartError("OVER_STOCK", msg, option.stock);
    }
    return tx.cartItem.upsert({
      where: { userId_optionId: { userId, optionId } },
      create: { userId, optionId, quantity },
      update: { quantity: total },
    });
  });
}

/** 수량 변경(O-02, 7.3): 1 미만은 1로, 현재 재고보다 크면 저장하지 않고 남은 수량 안내 */
export async function setCartQuantity(userId: string, itemId: string, quantity: number) {
  const item = await db.cartItem.findFirst({ where: { id: itemId, userId }, include: { option: true } });
  if (!item) throw new CartError("NOT_FOUND", "장바구니 항목을 찾을 수 없습니다.");
  const q = Number.isInteger(quantity) && quantity >= 1 ? quantity : 1;
  if (q > item.option.stock) throw new CartError("OVER_STOCK", `남은 재고는 ${item.option.stock}개입니다. ${item.option.stock}개 이하로 담아 주세요.`, item.option.stock);
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: q } });
  return { quantity: q, reset: q !== quantity };
}

/** 선택 삭제(O-02): 본인 항목만 */
export function removeCartItems(userId: string, itemIds: string[]) {
  return db.cartItem.deleteMany({ where: { userId, id: { in: itemIds } } });
}

export type CartLine = {
  id: string; optionId: string; productId: string; productName: string; optionName: string; isDefaultOption: boolean;
  imageUrl: string | null; unitPrice: number; quantity: number; stock: number;
  /** 구매 불가 사유(1.4): 판매 중지 > 품절 > 재고 부족 */
  problem: null | { code: "STOPPED" | "SOLD_OUT" | "OUT_OF_STOCK"; message: string };
};

export async function getCart(userId: string): Promise<CartLine[]> {
  const items = await db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { option: { include: { product: { include: { images: { where: { kind: "MAIN" }, orderBy: { sortOrder: "asc" }, take: 1 } } } } } },
  });
  return items.map((it) => {
    const p = it.option.product;
    const problem: CartLine["problem"] =
      p.status !== "ON_SALE" ? { code: "STOPPED", message: "판매가 중지된 상품입니다. 선택 해제하거나 삭제해 주세요." }
      : it.option.stock === 0 ? { code: "SOLD_OUT", message: "선택한 옵션이 품절되었습니다. 선택 해제하거나 삭제해 주세요." }
      : it.quantity > it.option.stock ? { code: "OUT_OF_STOCK", message: `재고 부족: 남은 재고는 ${it.option.stock}개입니다. 수량을 ${it.option.stock}개 이하로 줄여 주세요.` }
      : null;
    return {
      id: it.id, optionId: it.optionId, productId: p.id, productName: p.name, optionName: it.option.name, isDefaultOption: it.option.isDefault,
      imageUrl: p.images[0]?.url ?? null, unitPrice: p.price + it.option.extraPrice, quantity: it.quantity, stock: it.option.stock, problem,
    };
  });
}

/** 예상 결제 금액(O-02, 7.4): 선택 항목의 (판매가 + 옵션 추가금) × 수량의 합. 배송비·할인 0원 */
export const cartTotal = (lines: Pick<CartLine, "unitPrice" | "quantity">[]) => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
