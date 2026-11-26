import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addToCart, CartError, cartTotal, getCart, setCartQuantity } from "@/lib/cart";
import { makeProduct, makeUser } from "./helpers";

describe("장바구니(O-01·O-02, PRD 7.3)", () => {
  it("담아도 재고는 차감하지 않는다(D-11)", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }] });
    await addToCart(u.id, p.options[0].id, 2);
    expect((await db.productOption.findUnique({ where: { id: p.options[0].id } }))!.stock).toBe(5);
  });

  it("같은 옵션을 다시 담으면 합산하고, 합산이 재고를 넘으면 거부(D-5)", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }] });
    await addToCart(u.id, p.options[0].id, 2);
    await addToCart(u.id, p.options[0].id, 3);
    expect((await db.cartItem.findMany({ where: { userId: u.id } })).map((c) => c.quantity)).toEqual([5]);
    await expect(addToCart(u.id, p.options[0].id, 1)).rejects.toMatchObject({ code: "OVER_STOCK", remaining: 5 });
  });

  it("판매 중지·품절 옵션은 담을 수 없다", async () => {
    const u = await makeUser();
    const stopped = await makeProduct({ status: "STOPPED" });
    const soldOut = await makeProduct({ options: [{ name: "A", stock: 0 }] });
    await expect(addToCart(u.id, stopped.options[0].id, 1)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(addToCart(u.id, soldOut.options[0].id, 1)).rejects.toMatchObject({ code: "SOLD_OUT" });
    await expect(addToCart(u.id, soldOut.options[0].id, 0)).rejects.toBeInstanceOf(CartError);
  });

  it("수량 변경: 1 미만은 1로, 재고 초과는 저장하지 않음", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 4 }] });
    const item = await addToCart(u.id, p.options[0].id, 2);
    expect(await setCartQuantity(u.id, item.id, 0)).toEqual({ quantity: 1, reset: true });
    await expect(setCartQuantity(u.id, item.id, 9)).rejects.toMatchObject({ code: "OVER_STOCK", remaining: 4 });
    expect((await db.cartItem.findUnique({ where: { id: item.id } }))!.quantity).toBe(1);
  });

  it("남의 장바구니 항목은 바꿀 수 없다", async () => {
    const a = await makeUser(); const b = await makeUser(); const p = await makeProduct();
    const item = await addToCart(a.id, p.options[0].id, 1);
    await expect(setCartQuantity(b.id, item.id, 2)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("구매 불가 사유: 판매 중지 > 품절 > 재고 부족, 예상 금액 = (판매가+추가금)×수량", async () => {
    const u = await makeUser();
    const p = await makeProduct({ price: 1000, options: [{ name: "A", stock: 5, extraPrice: 500 }, { name: "B", stock: 5 }, { name: "C", stock: 5 }] });
    for (const o of p.options) await addToCart(u.id, o.id, 3);
    await db.productOption.update({ where: { id: p.options[1].id }, data: { stock: 0 } });
    await db.productOption.update({ where: { id: p.options[2].id }, data: { stock: 2 } });
    const lines = await getCart(u.id);
    const by = (n: string) => lines.find((l) => l.optionName === n)!;
    expect(by("A").problem).toBeNull();
    expect(by("B").problem?.code).toBe("SOLD_OUT");
    expect(by("C").problem?.code).toBe("OUT_OF_STOCK");
    expect(cartTotal([by("A")])).toBe(4500);
    await db.product.update({ where: { id: p.id }, data: { status: "STOPPED" } });
    expect((await getCart(u.id)).every((l) => l.problem?.code === "STOPPED")).toBe(true);
  });
});
