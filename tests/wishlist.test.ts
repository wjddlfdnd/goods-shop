import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addWish, listWishlist, toggleWish } from "@/lib/wishlist";
import { parseIntent } from "@/lib/intent";
import { runIntent } from "@/lib/run-intent";
import { makeProduct, makeUser } from "./helpers";

describe("찜(U-06)", () => {
  it("누르면 찜, 다시 누르면 해제", async () => {
    const u = await makeUser(); const p = await makeProduct();
    expect(await toggleWish(u.id, p.id)).toBe(true);
    expect(await toggleWish(u.id, p.id)).toBe(false);
    expect(await db.wishlist.count({ where: { userId: u.id } })).toBe(0);
  });

  it("같은 회원·상품 조합은 1건(동시 요청 포함)", async () => {
    const u = await makeUser(); const p = await makeProduct();
    await Promise.all([addWish(u.id, p.id), addWish(u.id, p.id), addWish(u.id, p.id)]);
    expect(await db.wishlist.count({ where: { userId: u.id } })).toBe(1);
  });

  it("판매 중지 상품도 목록에 남고 상태를 표시한다", async () => {
    const u = await makeUser(); const p = await makeProduct({ status: "STOPPED" });
    await addWish(u.id, p.id);
    expect((await listWishlist(u.id))[0]).toMatchObject({ id: p.id, stopped: true });
  });

  it("비회원이 누른 찜은 로그인 후 이어서 담긴다(U-02)", async () => {
    const u = await makeUser(); const p = await makeProduct();
    const intent = parseIntent(`wish:${p.id}:1`)!;
    expect(await runIntent(u.id, intent, `/products/${p.id}`)).toBe(`/products/${p.id}?notice=WISHED`);
    expect(await db.wishlist.count({ where: { userId: u.id, productId: p.id } })).toBe(1);
  });
});
