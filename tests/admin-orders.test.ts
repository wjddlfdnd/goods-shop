import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { advanceOrderStatus, listAdminOrders, salesSummary } from "@/lib/admin-orders";
import { cancelOrder, placeOrder } from "@/lib/order";
import { makeProduct, makeUser, orderInput } from "./helpers";

async function order(price = 1000) {
  const u = await makeUser(); const p = await makeProduct({ price });
  const { orderNumber } = await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }));
  const o = await db.order.findUniqueOrThrow({ where: { orderNumber } });
  return { u, o };
}

describe("주문 상태 변경(A-07)", () => {
  it("결제 완료 → 배송 준비 → 배송 중 → 배송 완료, 다음 단계로만", async () => {
    const { o } = await order();
    await advanceOrderStatus(o.id, "PAID", "PREPARING");
    await expect(advanceOrderStatus(o.id, "PREPARING", "DELIVERED")).rejects.toMatchObject({ code: "INVALID_TRANSITION" }); // 건너뛰기
    await expect(advanceOrderStatus(o.id, "PREPARING", "PAID")).rejects.toMatchObject({ code: "INVALID_TRANSITION" }); // 역방향
    await expect(advanceOrderStatus(o.id, "PREPARING", "CANCELED")).rejects.toMatchObject({ code: "INVALID_TRANSITION" }); // 관리자는 취소 불가
    await advanceOrderStatus(o.id, "PREPARING", "SHIPPING");
    await advanceOrderStatus(o.id, "SHIPPING", "DELIVERED");
    await expect(advanceOrderStatus(o.id, "DELIVERED", "DELIVERED")).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("주문 취소 상태는 바꿀 수 없고, 회원이 먼저 취소하면 화면의 상태로는 바꾸지 못한다", async () => {
    const { u, o } = await order();
    await cancelOrder(u.id, o.orderNumber); // 관리자가 '결제 완료'를 보고 있는 사이 회원 취소
    await expect(advanceOrderStatus(o.id, "PAID", "PREPARING")).rejects.toMatchObject({ code: "ORDER_CANCELED" });
    await expect(advanceOrderStatus(o.id, "CANCELED", "PREPARING")).rejects.toMatchObject({ code: "ORDER_CANCELED" });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CANCELED");
  });
});

describe("주문 목록(A-06)·판매 현황(A-08)", () => {
  it("주문 번호·상태·기간(한국 날짜)으로 찾는다", async () => {
    const { o } = await order();
    expect((await listAdminOrders({ orderNumber: o.orderNumber })).items.map((i) => i.id)).toEqual([o.id]);
    await db.order.update({ where: { id: o.id }, data: { createdAt: new Date("2026-01-01T23:30:00+09:00") } });
    const hit = await listAdminOrders({ orderNumber: o.orderNumber, from: "2026-01-01", to: "2026-01-01" });
    const miss = await listAdminOrders({ orderNumber: o.orderNumber, from: "2026-01-02" });
    expect([hit.total, miss.total]).toEqual([1, 0]);
    expect((await listAdminOrders({ orderNumber: o.orderNumber, status: "SHIPPING" })).total).toBe(0);
  });

  it("총 주문 수·총매출은 주문 취소를 뺀다", async () => {
    const before = await salesSummary();
    const a = await order(7000); const b = await order(3000);
    await cancelOrder(b.u.id, b.o.orderNumber);
    const after = await salesSummary();
    expect(after.orderCount - before.orderCount).toBe(1);
    expect(after.revenue - before.revenue).toBe(7000);
    void a;
  });
});
