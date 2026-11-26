import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { bootstrap } from "../prisma/bootstrap";

// 10단계 배포 초기 데이터(LEDGER #114): 빌드마다 실행돼도 데이터를 지우거나 늘리지 않는다
describe("배포 초기 데이터(bootstrap)", () => {
  const email = "Ops.Admin@Example.com";

  it("환경 변수가 없거나 비밀번호가 짧으면 실패", async () => {
    await expect(bootstrap(db, {})).rejects.toThrow("ADMIN_EMAIL");
    await expect(bootstrap(db, { email, password: "short" })).rejects.toThrow("ADMIN_PASSWORD");
  });

  it("상품이 있으면 카탈로그를 건드리지 않고 관리자만 만든다", async () => {
    const before = await db.product.count();
    const r = await bootstrap(db, { email, password: "prod-pass-1" });
    expect(r).toMatchObject({ catalog: "kept", admin: "created", products: before });
    const u = await db.user.findUniqueOrThrow({ where: { email: "ops.admin@example.com" } });
    expect(u.role).toBe("ADMIN");
    expect(await bcrypt.compare("prod-pass-1", u.passwordHash)).toBe(true);
  });

  it("다시 실행하면 그대로, 비밀번호를 바꾸면 갱신하고 기존 로그인을 끊는다", async () => {
    expect((await bootstrap(db, { email, password: "prod-pass-1" })).admin).toBe("unchanged");
    const u = await db.user.findUniqueOrThrow({ where: { email: "ops.admin@example.com" } });
    await db.session.create({ data: { id: `bootstrap-test-${Date.now()}`, userId: u.id, expiresAt: new Date(Date.now() + 86_400_000) } });
    expect((await bootstrap(db, { email, password: "prod-pass-2" })).admin).toBe("updated");
    expect(await db.session.count({ where: { userId: u.id } })).toBe(0);
    expect(await db.user.count({ where: { email: "ops.admin@example.com" } })).toBe(1);
  });
});
