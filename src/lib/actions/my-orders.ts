"use server";
// 주문 취소(O-07, 2차)
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { cancelOrder, OrderError } from "@/lib/order";

export type CancelState = { error?: string; ok?: string } | undefined;

export async function cancelOrderAction(orderNumber: string): Promise<CancelState> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/account/orders/${orderNumber}`);
  try {
    await cancelOrder(user.id, orderNumber);
  } catch (e) {
    if (e instanceof OrderError) { refresh(); return { error: e.message }; }
    throw e;
  }
  // 취소되면 상태가 바뀌어 취소 버튼이 사라지므로, 안내는 페이지가 주소로 받아 보여 준다
  redirect(`/account/orders/${orderNumber}?canceled=1`);
}
