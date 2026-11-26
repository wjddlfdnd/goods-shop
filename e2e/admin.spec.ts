import { expect, test } from "@playwright/test";
import { login, visible } from "./helpers";

// 시나리오 5 1–2단계(M2): 관리자 상품 등록 → 판매 중 노출 → 판매 중지
test("시나리오 5: 관리자 상품 등록 → 사용자 목록 노출 → 판매 중지 → 목록에서 빠짐", async ({ page }) => {
  const name = `E2E 등록 상품 ${Date.now()}`;
  await page.goto("/login");
  await login(page, "admin@goodsshop.test", "admin1234");
  await page.waitForURL(/\/admin\/products/);

  await page.goto("/admin/products?edit=new");
  await page.fill("#p-name", name);
  await page.selectOption("#p-cat", { label: "키링" });
  await page.fill("#p-price", "7000");
  await page.fill("#p-stock", "5");
  await page.click("button:has-text('저장')");
  await page.waitForURL(/saved=1/);

  await page.goto("/search?q=" + encodeURIComponent(name));
  await expect(visible(page, name)).toBeVisible();

  await page.goto("/admin/products?q=" + encodeURIComponent(name));
  await page.click(`a[aria-label="${name} 수정"]`);
  await page.selectOption("#p-status", "STOPPED");
  await page.click("button:has-text('저장')");
  await page.waitForURL(/saved=1/);

  await page.goto("/search?q=" + encodeURIComponent(name));
  await expect(visible(page, /에 맞는 상품이 없습니다/)).toBeVisible();
});

test("관리자 접근 제한(A-01): 회원·비회원은 홈으로 이동해 안내", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(visible(page, "관리자만 들어갈 수 있는 페이지입니다.")).toBeVisible();
  await page.goto("/login");
  await login(page, "goods@example.com", "goods1234");
  await page.waitForURL("/");
  await page.goto("/admin/categories");
  await expect(visible(page, "관리자만 들어갈 수 있는 페이지입니다.")).toBeVisible();
  expect((await page.request.get("/api/admin/products")).status()).toBe(403);
});
