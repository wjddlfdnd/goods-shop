import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { profileSchema, updateProfile } from "@/lib/account";
import { fieldErrors } from "@/lib/validation";

/** GET /api/me — U-02 */
export async function GET() {
  await connection();
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
}

/** PATCH /api/me — U-03(2차): { name, phone }. 이메일은 바꿀 수 없다 */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const parsed = profileSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
  return ok(await updateProfile(user.id, parsed.data));
}
