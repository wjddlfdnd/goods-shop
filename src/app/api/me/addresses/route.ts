import { connection } from "next/server";
import { addressSchema, listAddresses, saveAddress } from "@/lib/account";
import { fieldErrors } from "@/lib/validation";
import { fail, memberRoute, ok, readJson } from "@/lib/api";

/** GET /api/me/addresses — U-04 */
export async function GET() {
  await connection();
  return memberRoute(async (u) => ok(await listAddresses(u.id)));
}

/** POST /api/me/addresses — U-04: 기본 배송지는 회원당 1개(새 기본 지정 시 이전 해제) */
export async function POST(request: Request) {
  return memberRoute(async (u) => {
    const parsed = addressSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
    return ok(await saveAddress(u.id, null, parsed.data), 201);
  });
}
