import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addressSchema, deleteAddress, saveAddress, setDefaultAddress, updateProfile, ADDRESS_LIMIT } from "@/lib/account";
import { makeUser } from "./helpers";

const addr = (extra = {}) => addressSchema.parse({ recipient: "받는 사람", phone: "010-1234-5678", address1: "서울시 마포구 굿즈로 12", ...extra });
const defaults = async (userId: string) => (await db.address.findMany({ where: { userId, isDefault: true } })).length;

describe("회원 정보 수정(U-03)", () => {
  it("이름·연락처만 바꾸고 연락처는 숫자만 저장", async () => {
    const u = await makeUser();
    const r = await updateProfile(u.id, { name: "새 이름", phone: "01099998888" });
    expect(r).toMatchObject({ name: "새 이름", phone: "01099998888", email: u.email });
  });
});

describe("배송지 관리(U-04)", () => {
  it("첫 배송지는 기본, 새 기본을 지정하면 이전 기본 해제(회원당 1개)", async () => {
    const u = await makeUser();
    const a = await saveAddress(u.id, null, addr());
    expect(a.isDefault).toBe(true);
    const b = await saveAddress(u.id, null, addr({ isDefault: true }));
    expect(await defaults(u.id)).toBe(1);
    expect((await db.address.findUniqueOrThrow({ where: { id: b.id } })).isDefault).toBe(true);
    await setDefaultAddress(u.id, a.id);
    expect((await db.address.findUniqueOrThrow({ where: { id: a.id } })).isDefault).toBe(true);
    expect(await defaults(u.id)).toBe(1);
    expect(a.phone).toBe("01012345678");
  });

  it("기본 배송지를 지우면 기본이 없어진다", async () => {
    const u = await makeUser();
    const a = await saveAddress(u.id, null, addr());
    await deleteAddress(u.id, a.id);
    expect(await defaults(u.id)).toBe(0);
  });

  it("남의 배송지는 수정·삭제·기본 지정 불가, 최대 개수 제한", async () => {
    const owner = await makeUser(); const other = await makeUser();
    const a = await saveAddress(owner.id, null, addr());
    await expect(saveAddress(other.id, a.id, addr())).rejects.toMatchObject({ status: 404 });
    await expect(deleteAddress(other.id, a.id)).rejects.toMatchObject({ status: 404 });
    await expect(setDefaultAddress(other.id, a.id)).rejects.toMatchObject({ status: 404 });
    for (let i = 1; i < ADDRESS_LIMIT; i++) await saveAddress(owner.id, null, addr());
    await expect(saveAddress(owner.id, null, addr())).rejects.toMatchObject({ code: "TOO_MANY" });
  });
});
