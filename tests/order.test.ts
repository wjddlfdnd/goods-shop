import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addToCart } from "@/lib/cart";
import { newOrderNumber, placeOrder } from "@/lib/order";
import { makeProduct, makeUser, orderInput } from "./helpers";

const stockOf = async (id: string) => (await db.productOption.findUniqueOrThrow({ where: { id } })).stock;

describe("모의 결제 트랜잭션(O-05, PRD 6장)", () => {
  it("주문 번호는 YYYYMMDD-6자리(D-7)", () => expect(newOrderNumber()).toMatch(/^\d{8}-\d{6}$/));

  it("장바구니 경유: 재고 차감·주문 시점 복사·장바구니 항목 삭제·결제 완료·연락처 숫자만", async () => {
    const u = await makeUser(); const p = await makeProduct({ price: 2000, options: [{ name: "A", stock: 5, extraPrice: 300 }] });
    const item = await addToCart(u.id, p.options[0].id, 2);
    const { orderNumber } = await placeOrder(u.id, orderInput({ from: "cart", itemIds: [item.id] }, { saveAsDefault: true }));
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true } });
    expect(order.status).toBe("PAID");
    expect(order.totalAmount).toBe(4600);
    expect(order.ordererPhone).toBe("01011112222");
    expect(order.items[0]).toMatchObject({ productName: p.name, optionName: "A", unitPrice: 2300, quantity: 2 });
    expect(await stockOf(p.options[0].id)).toBe(3);
    expect(await db.cartItem.count({ where: { userId: u.id } })).toBe(0);
    expect(await db.address.count({ where: { userId: u.id, isDefault: true } })).toBe(1);
    // 이후 상품 이름·가격을 바꿔도 주문 상품은 그대로(6장)
    await db.product.update({ where: { id: p.id }, data: { name: "바뀐 이름", price: 9999 } });
    expect((await db.orderItem.findFirstOrThrow({ where: { orderId: order.id } })).unitPrice).toBe(2300);
  });

  it("바로 구매는 장바구니를 바꾸지 않는다(O-03)", async () => {
    const u = await makeUser(); const p = await makeProduct();
    const kept = await addToCart(u.id, p.options[0].id, 1);
    await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 2 }));
    expect(await db.cartItem.findUnique({ where: { id: kept.id } })).not.toBeNull();
  });

  it("같은 주문 요청 키는 주문 1건(중복 클릭·새로고침·동시 요청)", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 10 }] });
    const input = orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 });
    const [a, b] = await Promise.all([placeOrder(u.id, input), placeOrder(u.id, input)]);
    expect(a.orderNumber).toBe(b.orderNumber);
    expect(await db.order.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
    expect(await stockOf(p.options[0].id)).toBe(9);
  });

  it("재고 부족이면 아무것도 바뀌지 않는다(전체 롤백)", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }, { name: "B", stock: 1 }] });
    const a = await addToCart(u.id, p.options[0].id, 2); const b = await addToCart(u.id, p.options[1].id, 1);
    await db.productOption.update({ where: { id: p.options[1].id }, data: { stock: 0 } });
    await expect(placeOrder(u.id, orderInput({ from: "cart", itemIds: [a.id, b.id] }))).rejects.toMatchObject({ code: "OUT_OF_STOCK", items: [{ optionId: p.options[1].id, remaining: 0 }] });
    expect(await stockOf(p.options[0].id)).toBe(5);
    expect(await db.cartItem.count({ where: { userId: u.id } })).toBe(2);
    expect(await db.order.count({ where: { userId: u.id } })).toBe(0);
  });

  it("판매 중지 상품이 섞이면 주문하지 않는다", async () => {
    const u = await makeUser(); const p = await makeProduct({ status: "STOPPED" });
    await expect(placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }))).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await stockOf(p.options[0].id)).toBe(10);
  });

  it("M5 동시 결제: 재고 1개 옵션에 두 회원이 동시에 10회 → 매번 1건만 성공, 재고 0 미만 없음", async () => {
    const a = await makeUser(); const b = await makeUser();
    for (let i = 0; i < 10; i++) {
      const p = await makeProduct({ options: [{ name: "A", stock: 1 }] });
      const src = { from: "buy" as const, optionId: p.options[0].id, quantity: 1 };
      const results = await Promise.allSettled([placeOrder(a.id, orderInput(src)), placeOrder(b.id, orderInput(src))]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await stockOf(p.options[0].id)).toBe(0);
    }
  });
});
