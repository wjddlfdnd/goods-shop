import { addressSchema, deleteAddress, saveAddress } from "@/lib/account";
import { fieldErrors } from "@/lib/validation";
import { fail, memberRoute, ok, readJson } from "@/lib/api";

/** PATCH /api/me/addresses/{id} — U-04 수정·기본 지정 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/me/addresses/[id]">) {
  return memberRoute(async (u) => {
    const parsed = addressSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
    return ok(await saveAddress(u.id, (await ctx.params).id, parsed.data));
  });
}

/** DELETE /api/me/addresses/{id} — U-04 */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/me/addresses/[id]">) {
  return memberRoute(async (u) => { await deleteAddress(u.id, (await ctx.params).id); return ok({ deleted: true }); });
}
