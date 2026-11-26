"use server";
// 회원가입·로그인·로그아웃 서버 액션(U-01·U-02)
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authenticate, endSession, hashPassword, safeNext, startSession } from "@/lib/auth";
import { fieldErrors, signupSchema, type FieldErrors } from "@/lib/validation";
import { parseIntent } from "@/lib/intent";
import { runIntent } from "@/lib/run-intent";

export type FormState = { errors?: FieldErrors; message?: string; values?: Record<string, string> } | undefined;

export async function signupAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(["email", "password", "passwordConfirm", "name", "phone"].map((k) => [k, String(form.get(k) ?? "")]));
  const values = { email: raw.email, name: raw.name, phone: raw.phone }; // 비밀번호는 돌려주지 않는다
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email, password, name, phone } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { errors: { email: "이미 가입된 이메일입니다." }, values };
  try {
    await db.user.create({ data: { email, passwordHash: await hashPassword(password), name, phone } });
  } catch {
    return { errors: { email: "이미 가입된 이메일입니다." }, values }; // 동시에 가입한 경우(고유 제약)
  }
  const next = String(form.get("next") ?? "");
  redirect(`/login?joined=1${next ? `&next=${encodeURIComponent(next)}` : ""}`); // 가입 성공 → 로그인 화면(v1.2)
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email.trim() || !password) return { errors: { password: "이메일과 비밀번호를 입력해 주세요." }, values: { email } };
  const user = await authenticate(email, password);
  if (!user) return { errors: { email: " ", password: "이메일 또는 비밀번호가 일치하지 않습니다." }, values: { email } };
  await startSession(user.id);
  const next = safeNext(form.get("next"), user.role === "ADMIN" ? "/admin/products" : "/");
  const intent = parseIntent(form.get("intent"));
  redirect(intent ? await runIntent(user.id, intent, next) : next);
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
