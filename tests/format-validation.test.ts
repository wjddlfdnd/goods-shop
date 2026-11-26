import { describe, expect, it } from "vitest";
import { eulReul, euro, formatPhone, won } from "@/lib/format";
import { phoneSchema, signupSchema } from "@/lib/validation";
import { parseIntent } from "@/lib/intent";
import { safeNext } from "@/lib/auth";

describe("표시 형식", () => {
  it("금액은 원 단위 정수에 쉼표(7.4)", () => expect(won(28300)).toBe("28,300원"));
  it("연락처는 화면에서만 하이픈(v1.4)", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
    expect(formatPhone("0212345678")).toBe("02-1234-5678");
    expect(formatPhone("010-1234-5678")).toBe("010-1234-5678");
  });
  it("조사 을/를·로/으로", () => {
    expect(eulReul("키링")).toBe("키링을"); expect(eulReul("의류")).toBe("의류를");
    expect(euro("배송 준비")).toBe("배송 준비로"); expect(euro("배송 중")).toBe("배송 중으로"); expect(euro("서울")).toBe("서울로");
  });
});

describe("입력 검증(U-01, v1.4)", () => {
  it("연락처는 하이픈을 빼고 숫자 10–11자리만 저장", () => {
    expect(phoneSchema.parse("010-1234-5678")).toBe("01012345678");
    expect(phoneSchema.safeParse("010-123").success).toBe(false);
  });
  it("가입: 이메일 형식·비밀번호 8자·확인 일치", () => {
    const base = { email: "a@b.co", password: "password1", passwordConfirm: "password1", name: "가", phone: "01012345678" };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, email: "x" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "short", passwordConfirm: "short" }).success).toBe(false);
    const r = signupSchema.safeParse({ ...base, passwordConfirm: "other123" });
    expect(r.success || r.error.issues[0].message).toBe("비밀번호가 일치하지 않습니다.");
  });
});

describe("로그인 후 원래 행동(U-02)", () => {
  it("intent 해석", () => {
    expect(parseIntent("cart:opt1:2")).toEqual({ type: "cart", optionId: "opt1", quantity: 2 });
    expect(parseIntent("buy:opt1:0")).toBeNull();
    expect(parseIntent("hack:x:1")).toBeNull();
  });
  it("돌아갈 경로는 사이트 안 상대 경로만", () => {
    expect(safeNext("/products/1")).toBe("/products/1");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
  });
});
