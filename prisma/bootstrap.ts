// 배포 환경 초기 데이터(10단계, LEDGER #114). Vercel 빌드 때마다 실행되므로 여러 번 실행해도 안전해야 한다.
// - 데이터를 지우지 않는다(개발 시드 seed.ts와 다른 점).
// - 상품이 하나도 없을 때만 샘플 카탈로그(카테고리·상품)를 넣는다.
// - 관리자 계정 1개를 ADMIN_EMAIL·ADMIN_PASSWORD로 만들거나, 이미 있으면 비밀번호를 그 값으로 맞춘다.
// - 개발용 계정(admin1234·goods1234)과 테스트 회원은 넣지 않는다(PRD 6장).
import "dotenv/config";
import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createCatalog } from "./catalog";

export async function bootstrap(db: PrismaClient, admin: { email?: string; password?: string }) {
  const email = admin.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL 환경 변수에 관리자 이메일을 넣어 주세요.");
  if (!admin.password || admin.password.length < 8) throw new Error("ADMIN_PASSWORD 환경 변수에 8자 이상 비밀번호를 넣어 주세요.");

  const catalog = (await db.product.count()) === 0 && (await db.category.count()) === 0;
  if (catalog) await createCatalog(db);

  const passwordHash = await bcrypt.hash(admin.password, 10);
  const existing = await db.user.findUnique({ where: { email } });
  let adminAction: "created" | "updated" | "unchanged" = "unchanged";
  if (!existing) {
    await db.user.create({ data: { email, passwordHash, name: "관리자", phone: "01000000000", role: "ADMIN" } });
    adminAction = "created";
  } else if (existing.role !== "ADMIN" || !(await bcrypt.compare(admin.password, existing.passwordHash))) {
    // 비밀번호를 바꾸면 기존 로그인은 모두 끊는다
    await db.$transaction([
      db.user.update({ where: { id: existing.id }, data: { passwordHash, role: "ADMIN" } }),
      db.session.deleteMany({ where: { userId: existing.id } }),
    ]);
    adminAction = "updated";
  }
  return { catalog: catalog ? "created" : "kept", admin: adminAction, products: await db.product.count() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  bootstrap(db, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
    .then((r) => console.log("bootstrap done", r))
    .catch((e) => { console.error(`bootstrap failed: ${e instanceof Error ? e.message : e}`); process.exitCode = 1; })
    .finally(() => db.$disconnect());
}
