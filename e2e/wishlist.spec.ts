import { expect, test } from "@playwright/test";
import { login, resetMember, sql, visible } from "./helpers";

// U-06(2차): 비회원 찜 → 로그인 → 이어서 찜 → 찜 목록 → 해제
test("U-06: 비회원 찜 → 로그인 후 이어서 → 찜 목록 → 해제", async ({ page }) => {
  const uid = resetMember();
  sql(`delete from "Wishlist" where "userId"='${uid}'`);
  const pid = sql(`select id from "Product" where status='ON_SALE' order by name limit 1`);
  const name = sql(`select name from "Product" where id='${pid}'`);
  await page.goto(`/products/${pid}`);
  await page.click(`button[aria-label="${name} 찜하기"]`);
  await page.waitForURL(/\/login\?/);
  await expect(visible(page, "로그인하면 하려던 찜하기를 이어서 진행합니다.")).toBeVisible();
  await login(page, "goods@example.com", "goods1234");
  await page.waitForURL(/notice=WISHED/);
  await expect(visible(page, "찜 목록에 담았습니다.")).toBeVisible();
  await expect(page.locator(`button[aria-label="${name} 찜 해제"]`)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/account/wishlist");
  await expect(visible(page, name)).toBeVisible();
  await page.click(`button[aria-label="${name} 찜 해제"]`);
  await expect(visible(page, "찜한 상품이 없습니다")).toBeVisible();
  expect(sql(`select count(*) from "Wishlist" where "userId"='${uid}'`)).toBe("0");
});
