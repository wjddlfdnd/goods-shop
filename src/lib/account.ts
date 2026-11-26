// 마이페이지: 회원 정보 수정(U-03)·배송지 관리(U-04). 본인 데이터만 다룬다(PRD 7.1).
import { z } from "zod";
import { db } from "@/lib/db";
import { phoneSchema } from "@/lib/validation";

export class AccountError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const ADDRESS_LIMIT = 10; // 회원당 배송지 최대 개수(가정)

export const profileSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(50, "50자 이하로 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요.").pipe(phoneSchema),
});

/** 회원 정보 수정(U-03): 이름·연락처. 이메일은 바꿀 수 없다(가정, PRD) */
export function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  return db.user.update({ where: { id: userId }, data: input, select: { id: true, name: true, phone: true, email: true } });
}

export const addressSchema = z.object({
  recipient: z.string().trim().min(1, "받는 사람을 입력해 주세요.").max(50, "50자 이하로 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요.").pipe(phoneSchema),
  address1: z.string().trim().min(1, "주소를 입력해 주세요.").max(255, "255자 이하로 입력해 주세요."),
  address2: z.string().trim().max(255, "255자 이하로 입력해 주세요.").optional().transform((v) => v || null),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

export function listAddresses(userId: string) {
  return db.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

/**
 * 등록·수정(U-04). 기본 배송지는 회원당 1개: 새로 기본으로 지정하면 이전 기본을 같은 트랜잭션에서 해제한다.
 * 첫 배송지는 자동으로 기본(가정).
 */
export async function saveAddress(userId: string, id: string | null, input: AddressInput) {
  return db.$transaction(async (tx) => {
    if (id && !(await tx.address.findFirst({ where: { id, userId } }))) throw new AccountError(404, "NOT_FOUND", "배송지를 찾을 수 없습니다.");
    const count = await tx.address.count({ where: { userId } });
    if (!id && count >= ADDRESS_LIMIT) throw new AccountError(400, "TOO_MANY", `배송지는 ${ADDRESS_LIMIT}개까지 저장할 수 있습니다.`);
    const makeDefault = input.isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId, isDefault: true, ...(id ? { id: { not: id } } : {}) }, data: { isDefault: false } });
    const data = { recipient: input.recipient, phone: input.phone, address1: input.address1, address2: input.address2, ...(makeDefault ? { isDefault: true } : {}) };
    return id ? tx.address.update({ where: { id }, data }) : tx.address.create({ data: { ...data, userId } });
  });
}

/** 기본으로 지정(U-04) */
export async function setDefaultAddress(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    if (!(await tx.address.findFirst({ where: { id, userId } }))) throw new AccountError(404, "NOT_FOUND", "배송지를 찾을 수 없습니다.");
    await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: { isDefault: true } });
  });
}

/** 삭제(U-04). 기본 배송지를 지우면 기본이 없어진다 — 다음 주문서에서 '기본 배송지로 저장'을 다시 보여 준다(가정) */
export async function deleteAddress(userId: string, id: string) {
  const r = await db.address.deleteMany({ where: { id, userId } });
  if (!r.count) throw new AccountError(404, "NOT_FOUND", "배송지를 찾을 수 없습니다.");
}
