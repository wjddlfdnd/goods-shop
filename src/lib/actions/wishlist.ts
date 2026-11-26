"use server";
// 찜 버튼(U-06). 비회원은 로그인 화면으로 보내고, 로그인 후 이어서 찜한다(U-02·D-13)
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, safeNext } from "@/lib/auth";
import { loginUrl } from "@/lib/intent";
import { toggleWish, WishError } from "@/lib/wishlist";

export async function toggleWishAction(productId: string, back: string): Promise<{ wished?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(safeNext(back), { type: "wish", optionId: productId, quantity: 1 }));
  try {
    const wished = await toggleWish(user.id, productId);
    refresh();
    return { wished };
  } catch (e) {
    if (e instanceof WishError) return { error: e.message };
    throw e;
  }
}
