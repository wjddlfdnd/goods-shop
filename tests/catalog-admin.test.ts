import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { placeOrder } from "@/lib/order";
import { createCategory, deleteCategory, deleteProduct, productSchema, saveProduct } from "@/lib/admin";
import { makeCategory, makeProduct, makeUser, orderInput } from "./helpers";

describe("인기순·노출(D-3, 7.9, 7.2)", () => {
  it("취소 제외 주문 건수 순, 동률이면 최신순. 판매 중지·미분류는 노출하지 않는다", async () => {
    const cat = await makeCategory(); const u = await makeUser();
    const old = await makeProduct({ categoryId: cat.id, createdAt: new Date(Date.now() - 86400000 * 3) });
    const mid = await makeProduct({ categoryId: cat.id, createdAt: new Date(Date.now() - 86400000 * 2) });
    const fresh = await makeProduct({ categoryId: cat.id, createdAt: new Date(Date.now() - 86400000) });
    await makeProduct({ categoryId: cat.id, status: "STOPPED" });
    for (let i = 0; i < 2; i++) await placeOrder(u.id, orderInput({ from: "buy", optionId: old.options[0].id, quantity: 1 }));
    const canceled = await placeOrder(u.id, orderInput({ from: "buy", optionId: mid.options[0].id, quantity: 1 }));
    await placeOrder(u.id, orderInput({ from: "buy", optionId: mid.options[0].id, quantity: 1 }));
    await placeOrder(u.id, orderInput({ from: "buy", optionId: mid.options[0].id, quantity: 1 }));
    await db.order.update({ where: { orderNumber: canceled.orderNumber }, data: { status: "CANCELED" } }); // mid = 2건(취소 1 제외)
    const ids = (await listProducts({ categoryId: cat.id, sort: "popular" })).map((p) => p.id);
    expect(ids).toEqual([mid.id, old.id, fresh.id]); // mid·old 동률 2건 → 최신(mid) 먼저, 주문 0건 fresh 마지막
    const system = await db.category.findFirstOrThrow({ where: { isSystem: true } });
    const hidden = await makeProduct({ categoryId: system.id });
    const all = (await listProducts()).map((p) => p.id);
    expect(all).not.toContain(hidden.id);
    expect((await listProducts({ categoryId: system.id })).length).toBe(0);
  });
});

describe("관리자 규칙(A-02·A-04·A-05, D-6·D-12, v1.7)", () => {
  const input = (categoryId: string, extra = {}) => productSchema.parse({ name: "관리 상품", price: 1000, categoryId, status: "ON_SALE", ...extra });

  it("옵션이 없으면 기본 옵션 1개(D-6), 재고 음수는 거부", async () => {
    const cat = await makeCategory();
    const p = await saveProduct(null, input(cat.id, { defaultStock: 4 }));
    expect(await db.productOption.findMany({ where: { productId: p.id }, select: { isDefault: true, stock: true, extraPrice: true } })).toEqual([{ isDefault: true, stock: 4, extraPrice: 0 }]);
    expect(productSchema.safeParse({ ...input(cat.id), options: [{ name: "A", extraPrice: 0, stock: -1 }] }).success).toBe(false);
  });

  it("미분류는 선택할 수 없고, 미분류 상품은 판매 중으로 못 바꾼다", async () => {
    const system = await db.category.findFirstOrThrow({ where: { isSystem: true } });
    await expect(saveProduct(null, input(system.id, { status: "STOPPED" }))).rejects.toMatchObject({ code: "SYSTEM_CATEGORY" });
    const p = await makeProduct({ categoryId: system.id, status: "STOPPED" });
    await expect(saveProduct(p.id, input(system.id))).rejects.toMatchObject({ code: "UNCATEGORIZED_ON_SALE" });
  });

  it("주문 이력이 있는 옵션·상품은 삭제할 수 없다", async () => {
    const u = await makeUser(); const p = await makeProduct({ options: [{ name: "A", stock: 5 }, { name: "B", stock: 5 }] });
    await placeOrder(u.id, orderInput({ from: "buy", optionId: p.options[0].id, quantity: 1 }));
    const keepOnlyB = input(p.categoryId, { options: [{ id: p.options[1].id, name: "B", extraPrice: 0, stock: 5 }] });
    await expect(saveProduct(p.id, keepOnlyB)).rejects.toMatchObject({ code: "OPTION_HAS_ORDERS" });
    await expect(deleteProduct(p.id)).rejects.toMatchObject({ code: "HAS_ORDERS" });
    const fresh = await makeProduct();
    await deleteProduct(fresh.id);
    expect(await db.product.findUnique({ where: { id: fresh.id } })).toBeNull();
  });

  it("카테고리 삭제: 판매 중 연결이면 거부, 판매 중지만 남으면 확인 후 미분류로 이동(한 트랜잭션)", async () => {
    const cat = await createCategory(`삭제용-${Date.now()}`);
    const onSale = await makeProduct({ categoryId: cat.id });
    await expect(deleteCategory(cat.id, true)).rejects.toMatchObject({ code: "HAS_ON_SALE" });
    await db.product.update({ where: { id: onSale.id }, data: { status: "STOPPED" } });
    await expect(deleteCategory(cat.id, false)).rejects.toMatchObject({ code: "CONFIRM_REQUIRED" });
    expect(await deleteCategory(cat.id, true)).toEqual({ moved: 1 });
    const system = await db.category.findFirstOrThrow({ where: { isSystem: true } });
    expect((await db.product.findUniqueOrThrow({ where: { id: onSale.id } })).categoryId).toBe(system.id);
    await expect(deleteCategory(system.id, true)).rejects.toMatchObject({ status: 403 });
  });
});
