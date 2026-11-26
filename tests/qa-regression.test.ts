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
