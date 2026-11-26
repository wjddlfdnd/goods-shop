"use server";
// 모의 결제(O-05). 실패하면 아무것도 바뀌지 않고 화면은 입력값을 유지한다.
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { OrderError, parseSource, placeOrder } from "@/lib/order";
import { fieldErrors, phoneSchema, type FieldErrors } from "@/lib/validation";

export type OrderState = {
  errors?: FieldErrors; stock?: { optionId: string; remaining: number }[]; unavailable?: boolean; serverError?: boolean; message?: string;
} | undefined;

const req = (msg: string) => z.string().trim().min(1, msg);
const schema = z.object({
  ordererName: req("주문자 이름을 입력해 주세요."),
  ordererPhone: z.string().min(1, "주문자 연락처를 입력해 주세요.").pipe(phoneSchema),
  recipient: req("받는 사람을 입력해 주세요."),
  recipientPhone: z.string().min(1, "연락처를 입력해 주세요.").pipe(phoneSchema),
  address1: req("주소를 입력해 주세요."),
  address2: z.string().trim().max(255).optional(),
  requestNote: z.string().trim().max(255).optional(),
  paymentMethod: z.enum(["CARD", "TRANSFER", "EASY_PAY"], { message: "결제 수단을 선택해 주세요." }),
  idempotencyKey: z.string().uuid(),
});

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
