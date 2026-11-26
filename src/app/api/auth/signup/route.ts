import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fieldErrors, signupSchema } from "@/lib/validation";
import { fail, ok, readJson } from "@/lib/api";

/** POST /api/auth/signup — U-01 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = signupSchema.safeParse(body ?? {});
  if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
  const { email, password, name, phone } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return fail(409, "EMAIL_TAKEN", "이미 가입된 이메일입니다.");
  const user = await db.user.create({ data: { email, passwordHash: await hashPassword(password), name, phone }, select: { id: true, email: true, name: true } });
  return ok(user, 201);
}
