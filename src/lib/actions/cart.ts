"use server";
// 장바구니 화면의 수량 변경·선택 삭제(O-02)
import { refresh } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { CartError, removeCartItems, setCartQuantity } from "@/lib/cart";

export type CartActionState = { error?: string; itemId?: string; info?: string } | undefined;

export async function setQuantityAction(itemId: string, quantity: number): Promise<CartActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };
  try {
    const r = await setCartQuantity(user.id, itemId, quantity);
    refresh();
    return r.reset ? { itemId, info: "수량은 1 이상이어야 해서 1로 되돌렸습니다." } : undefined;
  } catch (e) {
    if (e instanceof CartError) return { error: e.message, itemId };
    throw e;
  }
}

export async function removeItemsAction(itemIds: string[]): Promise<CartActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };
  await removeCartItems(user.id, itemIds);
  refresh();
  return undefined;
}
