import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

/** GET /api/me — U-02 */
export async function GET() {
  await connection();
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
}
