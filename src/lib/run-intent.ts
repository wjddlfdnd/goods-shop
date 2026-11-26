// 로그인 직후 원래 행동 실행(U-02, PRD 4.2 시나리오 1).
// 실행 시점에 품절·판매 중지·재고 부족이면 행동하지 않고 상품 상세로 돌려 안내한다.
import type { Intent } from "@/lib/intent";
import { addToCart, CartError } from "@/lib/cart";
import { addWish, WishError } from "@/lib/wishlist";

export async function runIntent(userId: string, intent: Intent, next: string): Promise<string> {
  const sep = next.includes("?") ? "&" : "?";
  if (intent.type === "wish") {
    try { await addWish(userId, intent.optionId); return `${next}${sep}notice=WISHED`; } catch (e) { if (e instanceof WishError) return next; throw e; }
  }
  if (intent.type === "buy") return `/checkout?buy=${encodeURIComponent(`${intent.optionId}:${intent.quantity}`)}&back=${encodeURIComponent(next)}`;
  try {
    await addToCart(userId, intent.optionId, intent.quantity);
    return "/cart?added=1";
  } catch (e) {
    if (e instanceof CartError) return `${next}${next.includes("?") ? "&" : "?"}notice=${e.code}`;
    throw e;
  }
}
