// 시드 데이터 — PRD 6장 테스트 환경: 카테고리 6개 + 미분류, 카테고리별 상품, 옵션 있는/없는 상품,
// 품절 옵션, 판매 중지 상품, 관리자·회원 계정. 이름·가격은 6단계 UI 시안 예시와 같다.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createCatalog } from "./catalog";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  // 다시 실행해도 같은 결과가 되도록 비운다(개발 DB 전용).
  await db.$transaction([
    db.orderItem.deleteMany(), db.order.deleteMany(), db.cartItem.deleteMany(), db.wishlist.deleteMany(),
    db.productImage.deleteMany(), db.productOption.deleteMany(), db.product.deleteMany(), db.category.deleteMany(),
    db.address.deleteMany(), db.session.deleteMany(), db.user.deleteMany(),
  ]);

  await createCatalog(db);

  const hash = (p: string) => bcrypt.hash(p, 10);
  await db.user.create({ data: { email: "admin@goodsshop.test", passwordHash: await hash("admin1234"), name: "관리자", phone: "01000000000", role: "ADMIN" } });
  await db.user.create({ data: { email: "goods@example.com", passwordHash: await hash("goods1234"), name: "김하늘", phone: "01012345678" } });

  const counts = { categories: await db.category.count(), products: await db.product.count(), options: await db.productOption.count(), users: await db.user.count() };
  console.log("seed done", counts);
}

main().finally(() => db.$disconnect());
