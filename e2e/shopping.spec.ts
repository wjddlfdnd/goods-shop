import { expect, test } from "@playwright/test";
import { login, multiOptionProduct, resetMember, sql, visible } from "./helpers";

// 시나리오 1(비회원 탐색 → 로그인 → 원래 행동 복귀) + 시나리오 2(장바구니 구매)
test("시나리오 1·2: 탐색 → 로그인 → 담기 이어서 → 장바구니 → 주문서 → 모의 결제 → 주문 완료", async ({ page }) => {
  const uid = resetMember();
  const { productId, optionId } = multiOptionProduct();
  const stockBefore = Number(sql(`select stock from "ProductOption" where id = '${optionId}'`));

  await page.goto("/");
  await expect(visible(page, "신상품")).toBeVisible();
  await page.goto("/search?q=" + encodeURIComponent("키링"));
  await expect(visible(page, /검색 결과/)).toBeVisible();

  await page.goto(`/products/${productId}`);
  await page.selectOption("#opt", optionId);
  await page.click("button[aria-label='수량 늘리기']");
  await page.click("text=장바구니 담기");
  await page.waitForURL(/\/login\?/);
  await expect(visible(page, "로그인하면 하려던 장바구니 담기를 이어서 진행합니다.")).toBeVisible();
  await login(page, "goods@example.com", "goods1234");

  await page.waitForURL(/\/cart\?added=1/);
  await expect(visible(page, "장바구니에 담았습니다.")).toBeVisible();
  expect(sql(`select quantity from "CartItem" where "userId" = '${uid}' and "optionId" = '${optionId}'`)).toBe("2");

  await page.click("button:has-text('선택 상품 주문하기')");
  await page.waitForURL(/\/checkout\?items=/);
  await page.fill("#ship-name", "김하늘");
  await page.fill("#ship-phone", "01098765432");
  await page.fill("#ship-addr", "서울시 마포구 굿즈로 12");
  await page.click("button:has-text('결제하기')");

  await page.waitForURL(/\/orders\/\d{8}-\d{6}\/complete/);
  await expect(visible(page, "주문이 완료되었습니다")).toBeVisible();
  await expect(visible(page, "결제 완료")).toBeVisible();
  expect(Number(sql(`select stock from "ProductOption" where id = '${optionId}'`))).toBe(stockBefore - 2);
  expect(sql(`select count(*) from "CartItem" where "userId" = '${uid}'`)).toBe("0");
});

// 시나리오 3(바로 구매): 장바구니에 저장하지 않고 주문서로
test("시나리오 3: 바로 구매 → 주문서(기본 배송지 미리 채움) → 결제 → 완료, 장바구니 그대로", async ({ page }) => {
  const uid = resetMember();
  sql(`insert into "Address" (id, "userId", recipient, phone, address1, "isDefault") values ('e2e-addr', '${uid}', '김하늘', '01098765432', '서울시 마포구 굿즈로 12', true)`);
  const { productId, optionId } = multiOptionProduct();
  await page.goto("/login");
  await login(page, "goods@example.com", "goods1234");
  await page.waitForURL("/");

  await page.goto(`/products/${productId}`);
  await page.click("text=바로 구매");
  await expect(visible(page, "옵션을 선택해 주세요.")).toBeVisible(); // 옵션 미선택(4.2 시나리오 3 예외)
  await page.selectOption("#opt", optionId);
  await page.click("text=바로 구매");
  await page.waitForURL(/\/checkout\?buy=/);
  await expect(page.locator("#ship-addr")).toHaveValue("서울시 마포구 굿즈로 12");
  await page.click("button:has-text('결제하기')");
  await page.waitForURL(/\/complete/);
  await expect(visible(page, "주문이 완료되었습니다")).toBeVisible();
  expect(sql(`select count(*) from "CartItem" where "userId" = '${uid}'`)).toBe("0");
});

test("빈 상태·오류: 빈 검색어, 검색 0건, 빈 장바구니, 없는 상품, 판매 중지 상품", async ({ page }) => {
  resetMember();
  await page.goto("/search?q=%20");
  await expect(visible(page, "검색어를 입력해 주세요")).toBeVisible();
  await page.goto("/search?q=" + encodeURIComponent("없는상품이름"));
  await expect(visible(page, /에 맞는 상품이 없습니다/)).toBeVisible();
  await page.goto("/products/not-a-product");
  await expect(visible(page, "상품을 찾을 수 없습니다")).toBeVisible();
  const stopped = sql(`select id from "Product" where status = 'STOPPED' limit 1`);
  await page.goto(`/products/${stopped}`);
  await expect(visible(page, "판매가 중지된 상품입니다.")).toBeVisible();
  await expect(page.locator("button:has-text('장바구니 담기')")).toBeDisabled();
  await page.goto("/login");
  await login(page, "goods@example.com", "goods1234");
  await page.waitForURL("/");
  await page.goto("/cart");
  await expect(visible(page, "장바구니가 비어 있습니다")).toBeVisible();
});
