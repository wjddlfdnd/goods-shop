import { endSession, getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

/** POST /api/auth/logout — U-02 */
export async function POST() {
  if (!(await getSessionUser())) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  await endSession();
  return ok({ loggedOut: true });
}
