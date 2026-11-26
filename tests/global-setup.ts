import { execSync } from "node:child_process";

// 테스트 DB를 마이그레이션하고 시드로 초기화한다. DATABASE_URL은 npm test 스크립트가 테스트 DB로 지정한다.
export default function setup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/goodsshop_test/.test(url)) throw new Error(`테스트는 goodsshop_test DB에서만 돌린다(현재: ${url.replace(/\/\/.*@/, "//***@")})`);
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: process.env });
  execSync("npx tsx prisma/seed.ts", { stdio: "ignore", env: process.env });
}
