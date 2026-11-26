import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

/** 테스트 전용 데이터: 이름에 접두어를 붙여 만들고 각 테스트가 끝나면 지운다 */
export const tag = () => `T${randomUUID().slice(0, 8)}`;

export async function makeUser(role: "MEMBER" | "ADMIN" = "MEMBER") {
  return db.user.create({ data: { email: `${tag()}@test.local`, passwordHash: "x", name: "테스트", phone: "01012345678", role } });
}

export async function makeCategory() {
  return db.category.create({ data: { name: tag(), sortOrder: 50 } });
}

export async function makeProduct(opts: { categoryId?: string; price?: number; status?: "ON_SALE" | "STOPPED"; options?: { name: string; stock: number; extraPrice?: number }[]; createdAt?: Date } = {}) {
  const categoryId = opts.categoryId ?? (await makeCategory()).id;
  return db.product.create({
    data: {
      name: tag(), price: opts.price ?? 1000, categoryId, status: opts.status ?? "ON_SALE", createdAt: opts.createdAt,
      options: { create: (opts.options ?? [{ name: "기본", stock: 10 }]).map((o, i) => ({ name: o.name, stock: o.stock, extraPrice: o.extraPrice ?? 0, sortOrder: i })) },
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
}

export const orderInput = (source: Parameters<typeof import("@/lib/order").placeOrder>[1]["source"], extra: Partial<Parameters<typeof import("@/lib/order").placeOrder>[1]> = {}) => ({
  idempotencyKey: randomUUID(), source, paymentMethod: "CARD" as const,
  ordererName: "주문자", ordererPhone: "010-1111-2222", recipient: "받는 사람", recipientPhone: "01033334444", address1: "서울시 마포구 굿즈로 12",
  ...extra,
});
