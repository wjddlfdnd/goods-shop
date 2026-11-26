import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { listProducts, likeText } from "@/lib/catalog";
import { addImages } from "@/lib/admin";
import { orderFieldsSchema } from "@/lib/validation";
import { makeProduct } from "./helpers";

// 1차 QA(release-1.0.0)에서 찾은 문제의 회귀 테스트(docs/05-QA.md)
describe("QA-04 검색어의 %·_는 글자 그대로", () => {
  it("'_'·'%'만 쳐도 전체가 나오지 않는다", async () => {
    expect(likeText(" a_b%c\\ ")).toBe("a\\_b\\%c\\\\");
    expect(await listProducts({ q: "_" })).toHaveLength(0);
    expect(await listProducts({ q: "%" })).toHaveLength(0);
  });
});

describe("QA-05·06 주문 입력 길이·요청 키 형식", () => {
  const ok = { ordererName: "가", ordererPhone: "01011112222", recipient: "나", recipientPhone: "01011112222", address1: "주소", paymentMethod: "CARD", idempotencyKey: randomUUID() };
  it("정상 입력은 통과", () => expect(orderFieldsSchema.safeParse(ok).success).toBe(true));
  it("이름 51자·주소 256자·요청 키 형식 오류는 거부", () => {
    expect(orderFieldsSchema.safeParse({ ...ok, ordererName: "가".repeat(51) }).success).toBe(false);
    expect(orderFieldsSchema.safeParse({ ...ok, address1: "가".repeat(256) }).success).toBe(false);
    expect(orderFieldsSchema.safeParse({ ...ok, idempotencyKey: "x".repeat(100) }).success).toBe(false);
  });
});

describe("QA-09 이미지는 파일 내용으로 형식 확인", () => {
  it("png라고 해도 내용이 png가 아니면 거부", async () => {
    const p = await makeProduct();
    const fake = new File([Buffer.from("<svg onload=alert(1)>")], "x.png", { type: "image/png" });
    await expect(addImages(p.id, [fake])).rejects.toMatchObject({ code: "BAD_TYPE" });
  });
});

describe("QA2 회귀(2차 QA)", () => {
  it("QA2-06 기본 배송지를 동시에 여러 번 지정해도 오류 없이 기본 1개", async () => {
    const { makeUser } = await import("./helpers");
    const { saveAddress, setDefaultAddress, addressSchema } = await import("@/lib/account");
    const { db } = await import("@/lib/db");
    const u = await makeUser();
    const addr = addressSchema.parse({ recipient: "가", phone: "01012345678", address1: "주소" });
    const list = [];
    for (let i = 0; i < 4; i++) list.push(await saveAddress(u.id, null, addr));
    for (let round = 0; round < 5; round++) {
      const rs = await Promise.allSettled(list.map((a) => setDefaultAddress(u.id, a.id)));
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      expect(await db.address.count({ where: { userId: u.id, isDefault: true } })).toBe(1);
    }
  });

  it("QA2-01 없는 날짜·범위 밖 페이지로 주문 검색해도 오류 없음", async () => {
    const { listAdminOrders } = await import("@/lib/admin-orders");
    const all = await listAdminOrders({});
    expect((await listAdminOrders({ from: "2026-13-40", to: "2026-02-30" })).total).toBe(all.total);
    const far = await listAdminOrders({ page: 1e9 });
    expect(far.page).toBe(far.pages);
  });
});

describe("QA2-07 같은 이름 동시 생성은 409", () => {
  it("카테고리 동시 추가: 하나만 생기고 나머지는 NAME_TAKEN", async () => {
    const { createCategory } = await import("@/lib/admin");
    const name = `동시-${Date.now()}`;
    const rs = await Promise.allSettled([createCategory(name), createCategory(name), createCategory(name)]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(rs.filter((r) => r.status === "rejected").every((r) => (r as PromiseRejectedResult).reason.code === "NAME_TAKEN")).toBe(true);
  });
});
