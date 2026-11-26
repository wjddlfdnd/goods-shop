import { authenticate, safeNext, startSession } from "@/lib/auth";
import { parseIntent } from "@/lib/intent";
import { runIntent } from "@/lib/run-intent";
import { fail, ok, readJson } from "@/lib/api";

/** POST /api/auth/login — U-02. 성공하면 쿠키를 심고 돌아갈 경로(redirect)를 알려 준다 */
export async function POST(request: Request) {
  const body = (await readJson(request)) ?? {};
  const user = await authenticate(String(body.email ?? ""), String(body.password ?? ""));
  if (!user) return fail(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다.");
  await startSession(user.id);
  const next = safeNext(body.next, user.role === "ADMIN" ? "/admin/products" : "/");
  const intent = parseIntent(body.intent);
  return ok({ redirect: intent ? await runIntent(user.id, intent, next) : next });
}
