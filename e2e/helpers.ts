import { execSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

export const sql = (q: string) =>
  execSync(`psql postgresql://postgres:postgres@localhost:5432/goodsshop_test -Atc ${JSON.stringify(q.replace(/\s+/g, " "))}`).toString().trim();

export const visible = (page: Page, text: string | RegExp) => page.getByText(text).locator("visible=true").first();

export async function login(page: Page, email: string, password: string) {
  await expect(page.locator("#login-email")).toBeVisible();
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click("button[type=submit]");
}

/** 판매 중이고 재고가 넉넉한 옵션이 2개 이상인 상품(옵션 선택 흐름용) */
export function multiOptionProduct() {
  const row = sql(`select p.id, o.id, o.name from "Product" p join "ProductOption" o on o."productId" = p.id
    where p.status = 'ON_SALE' and not o."isDefault" and o.stock >= 5 order by p.name, o."sortOrder" limit 1`);
  const [productId, optionId, optionName] = row.split("|");
  return { productId, optionId, optionName };
}

export function resetMember() {
  const uid = sql(`select id from "User" where email = 'goods@example.com'`);
  sql(`delete from "CartItem" where "userId" = '${uid}'`);
  sql(`delete from "Address" where "userId" = '${uid}'`);
  return uid;
}
