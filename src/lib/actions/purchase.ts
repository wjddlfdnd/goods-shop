"use server";
// 상품 상세의 장바구니 담기·바로 구매(O-01·O-03). 비회원은 로그인 화면으로 보내고 로그인 후 이어서 실행한다(U-02).
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loginUrl, type Intent } from "@/lib/intent";
import { addToCart, CartError } from "@/lib/cart";

export type PurchaseState = { error?: string; remaining?: number } | undefined;

function readIntent(type: Intent["type"], form: FormData): Intent | { error: string } {
  const optionId = String(form.get("optionId") ?? "");
  const quantity = Number(form.get("quantity"));
  if (!optionId) return { error: "옵션을 선택해 주세요." };
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "수량은 1 이상이어야 합니다." };
  return { type, optionId, quantity };
}

export async function addToCartAction(_prev: PurchaseState, form: FormData): Promise<PurchaseState> {
  const intent = readIntent("cart", form);
  if ("error" in intent) return intent;
  const back = String(form.get("back") ?? "/");
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(back, intent));
  try {
    await addToCart(user.id, intent.optionId, intent.quantity);
  } catch (e) {
    if (e instanceof CartError) return { error: e.message, remaining: e.remaining };
    throw e;
  }
  redirect("/cart?added=1");
}

export async function buyNowAction(_prev: PurchaseState, form: FormData): Promise<PurchaseState> {
  const intent = readIntent("buy", form);
  if ("error" in intent) return intent;
  const back = String(form.get("back") ?? "/");
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(back, intent));
  // 바로 구매는 장바구니에 저장하지 않고 선택한 옵션·수량만 주문서로 넘긴다(O-03). 재고는 주문서·결제에서 다시 확인
  redirect(`/checkout?buy=${encodeURIComponent(`${intent.optionId}:${intent.quantity}`)}&back=${encodeURIComponent(back)}`);
}
