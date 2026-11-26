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

// A-01 2차·A-06·A-07·A-08: 관리자 전용 로그인 → 대시보드 → 주문 상세 → 상태 변경
test("2차 관리자: 전용 로그인(회원 거부) → 대시보드 → 주문 상태 변경", async ({ page }) => {
  const { sql } = await import("./helpers");
  const uid = sql(`select id from "User" where email='goods@example.com'`);
  const opt = sql(`select o.id from "ProductOption" o join "Product" p on p.id=o."productId" where p.status='ON_SALE' and o.stock>3 order by o.id limit 1`);
  const on = `20261126-${String(Date.now()).slice(-6)}`;
  sql(`insert into "Order" (id, "orderNumber", "userId", "ordererName", "ordererPhone", recipient, "recipientPhone", address1, "paymentMethod", "totalAmount", "idempotencyKey") values ('e2e-${on}', '${on}', '${uid}', '김하늘', '01012345678', '김하늘', '01012345678', '서울', 'CARD', 8900, gen_random_uuid()::text)`);
  sql(`insert into "OrderItem" (id, "orderId", "productId", "optionId", "productName", "optionName", "unitPrice", quantity) select 'e2e-i-${on}', 'e2e-${on}', o."productId", o.id, '테스트 상품', o.name, 8900, 1 from "ProductOption" o where o.id='${opt}'`);

  await page.goto("/admin/login");
  await page.fill("#admin-email", "goods@example.com");
  await page.fill("#admin-password", "goods1234");
  await page.click("button:has-text('관리자 로그인')");
  await expect(visible(page, "관리자 계정이 아닙니다.", )).toBeVisible();
  await expect(page.locator("#admin-email")).toHaveValue("goods@example.com");
  await page.fill("#admin-email", "admin@goodsshop.test");
  await page.fill("#admin-password", "admin1234");
  await page.click("button:has-text('관리자 로그인')");
  await page.waitForURL(/\/admin\/dashboard/);
  await expect(visible(page, "총매출")).toBeVisible();

  await page.goto(`/admin/orders?q=${on}`);
  await page.click(`text=${on}`);
  page.on("dialog", (d) => d.accept());
  await page.click("button:has-text('배송 준비로 변경')");
  await expect(visible(page, "주문 상태를 바꿨습니다.")).toBeVisible();
  expect(sql(`select status from "Order" where "orderNumber"='${on}'`)).toBe("PREPARING");
  await expect(page.locator("button:has-text('배송 중으로 변경')")).toBeVisible();
});
