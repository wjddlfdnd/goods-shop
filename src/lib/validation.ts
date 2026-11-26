// 입력 검증 규칙(PRD U-01·O-04, v1.4). 화면 문구는 DESIGN 4.1을 따른다.
import { z } from "zod";

export const digitsOnly = (s: string) => s.replace(/\D/g, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const phoneSchema = z.string().transform(digitsOnly).refine((d) => /^[0-9]{10,11}$/.test(d), "연락처는 숫자 10–11자리로 입력해 주세요.");

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "이메일을 입력해 주세요.").regex(EMAIL, "이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  passwordConfirm: z.string(),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(50, "이름은 50자 이하로 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요.").pipe(phoneSchema),
}).refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], message: "비밀번호가 일치하지 않습니다." });

export type FieldErrors = Partial<Record<string, string>>;

/** zod 오류를 필드별 첫 문구로 */
export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "_");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
