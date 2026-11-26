import { expect, test } from "@playwright/test";
import { login, resetMember, sql, visible } from "./helpers";

// 2차 마이페이지: 회원 정보 수정(U-03)·배송지 관리(U-04) → 주문서 미리 채움(D-8)
test("U-03·U-04: 정보 수정, 배송지 추가·기본 지정, 주문서에 기본 배송지", async ({ page }) => {
  const uid = resetMember();
  await page.goto("/login?next=/account");
  await login(page, "goods@example.com", "goods1234");
  await page.waitForURL(/\/account$/);
  await page.click("text=내 정보 수정");
  await page.fill("#pf-name", "김하늘");
  await page.fill("#pf-phone", "01077776666");
  await page.click("button:has-text('저장')");
  await expect(visible(page, "회원 정보를 저장했습니다.")).toBeVisible();
  expect(sql(`select phone from "User" where id='${uid}'`)).toBe("01077776666");

  await page.goto("/account/addresses");
  await expect(visible(page, "저장된 배송지가 없습니다")).toBeVisible();
  for (const [addr, makeDefault] of [["서울시 마포구 굿즈로 12", false], ["부산시 해운대구 바다로 3", true]] as const) {
    await page.click("text=배송지 추가");
    await page.fill("#ad-addr", addr);
    if (makeDefault) await page.check("text=기본 배송지로 지정");
    await page.click("button:has-text('저장')");
    await expect(visible(page, "배송지를 저장했습니다.")).toBeVisible();
  }
  expect(sql(`select address1 from "Address" where "userId"='${uid}' and "isDefault"`)).toBe("부산시 해운대구 바다로 3");

  const opt = sql(`select o.id from "ProductOption" o join "Product" p on p.id=o."productId" where p.status='ON_SALE' and o.stock>3 limit 1`);
  await page.goto(`/checkout?buy=${opt}:1&back=/`);
  await expect(page.locator("#ship-addr")).toHaveValue("부산시 해운대구 바다로 3");
  await expect(page.locator("#buyer-phone")).toHaveValue("010-7777-6666");
  sql(`update "User" set phone='01012345678', name='김하늘' where id='${uid}'`);
});
