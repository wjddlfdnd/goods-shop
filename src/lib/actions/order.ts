"use server";
// 모의 결제(O-05). 실패하면 아무것도 바뀌지 않고 화면은 입력값을 유지한다.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { OrderError, parseSource, placeOrder } from "@/lib/order";
import { fieldErrors, orderFieldsSchema, type FieldErrors } from "@/lib/validation";

export type OrderState = {
  errors?: FieldErrors; stock?: { optionId: string; remaining: number }[]; unavailable?: boolean; serverError?: boolean; message?: string;
} | undefined;

const schema = orderFieldsSchema;

export async function placeOrderAction(_prev: OrderState, form: FormData): Promise<OrderState> {
  const user = await getSessionUser();
  if (!user) return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  const raw = Object.fromEntries(form.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const source = parseSource({ items: raw.items, buy: raw.buy });
  if (!source) return { message: "주문할 상품이 없습니다." };
  let orderNumber: string;
  try {
    ({ orderNumber } = await placeOrder(user.id, { ...parsed.data, source, saveAsDefault: raw.saveAsDefault === "on" }));
  } catch (e) {
    if (e instanceof OrderError) {
      if (e.code === "OUT_OF_STOCK") return { stock: e.items, message: e.message };
      if (e.code === "UNAVAILABLE") return { unavailable: true, message: e.message };
      return { message: e.message };
    }
    console.error("placeOrder failed", e);
    return { serverError: true }; // 서버 오류: 주문·재고·장바구니 변경 없음(트랜잭션 롤백), 재시도 안내
  }
  redirect(`/orders/${orderNumber}/complete`);
}
