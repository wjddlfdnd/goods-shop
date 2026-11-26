import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cancelOrder, listMyOrders, placeOrder } from "@/lib/order";
import { makeProduct, makeUser, orderInput } from "./helpers";

const stockOf = async (id: string) => (await db.productOption.findUniqueOrThrow({ where: { id } })).stock;

describe("주문 내역(U-05)", () => {
  it("본인 주문만, 최신순, 취소 주문도 남는다", async () => {
    const u = await makeUser(); const other = await makeUser(); const p = await makeProduct();
    const a = await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }));
    const b = await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 2 }));
    await placeOrder(other.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }));
    await cancelOrder(u.id, a.orderNumber);
    const list = await listMyOrders(u.id);
    expect(list.map((o) => o.orderNumber)).toEqual([b.orderNumber, a.orderNumber]);
    expect(list[1].status).toBe("CANCELED");
  });
});

describe("주문 취소(O-07, 기술 설계서 4.3)", () => {
  it("결제 완료면 취소하고 재고를 복구한다", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }, { name: "B", stock: 5 }] });
    await db.cartItem.createMany({ data: [{ userId: u.id, optionId: p.options[0].id, quantity: 2 }, { userId: u.id, optionId: p.options[1].id, quantity: 3 }] });
    const cart = await db.cartItem.findMany({ where: { userId: u.id } });
    const { orderNumber } = await placeOrder(u.id, orderInput({ from: "cart", itemIds: cart.map((c) => c.id) }));
    expect([await stockOf(p.options[0].id), await stockOf(p.options[1].id)]).toEqual([3, 2]);
    expect(await cancelOrder(u.id, orderNumber)).toEqual({ orderNumber, restored: 5 });
    expect([await stockOf(p.options[0].id), await stockOf(p.options[1].id)]).toEqual([5, 5]);
  });

  it("배송 준비 이후·이미 취소·남의 주문은 취소되지 않는다(재고 그대로)", async () => {
    const u = await makeUser(); const other = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }] });
    const { orderNumber } = await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }));
    await expect(cancelOrder(other.id, orderNumber)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await db.order.update({ where: { orderNumber }, data: { status: "PREPARING" } }); // 취소 확인 직전 관리자가 배송 준비로(시나리오 4 예외)
    await expect(cancelOrder(u.id, orderNumber)).rejects.toMatchObject({ code: "NOT_CANCELABLE", status: "PREPARING" });
    expect(await stockOf(p.options[0].id)).toBe(4);
  });

  it("같은 주문을 동시에 두 번 취소해도 재고는 한 번만 복구", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }] });
    const { orderNumber } = await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 2 }));
    const rs = await Promise.allSettled([cancelOrder(u.id, orderNumber), cancelOrder(u.id, orderNumber)]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(p.options[0].id)).toBe(5);
  });
});
