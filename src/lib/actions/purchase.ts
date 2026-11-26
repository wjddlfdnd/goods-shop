"use server";
// 상품 상세의 장바구니 담기·바로 구매(O-01·O-03). 비회원은 로그인 화면으로 보내고 로그인 후 이어서 실행한다(U-02).
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loginUrl, type Intent } from "@/lib/intent";
import { runIntent } from "@/lib/run-intent";

export type PurchaseState = { error?: string; ok?: string } | undefined;

function readIntent(type: Intent["type"], form: FormData): Intent | { error: string } {
  const optionId = String(form.get("optionId") ?? "");
  const quantity = Number(form.get("quantity"));
  if (!optionId) return { error: "옵션을 선택해 주세요." };
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "수량은 1 이상이어야 합니다." };
  return { type, optionId, quantity };
}

async function purchase(type: Intent["type"], form: FormData): Promise<PurchaseState> {
  const intent = readIntent(type, form);
  if ("error" in intent) return { error: intent.error };
  const back = String(form.get("back") ?? "/");
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(back, intent));
  redirect(await runIntent(user.id, intent, back));
}

export async function addToCartAction(_prev: PurchaseState, form: FormData) { return purchase("cart", form); }
export async function buyNowAction(_prev: PurchaseState, form: FormData) { return purchase("buy", form); }
