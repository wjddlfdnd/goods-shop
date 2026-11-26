import { deleteCategory, renameCategory } from "@/lib/admin";
import { adminRoute, ok, readJson } from "@/lib/api";

/** PATCH /api/admin/categories/{id} — A-05 이름 수정. 미분류 403 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  return adminRoute(async () => ok(await renameCategory((await ctx.params).id, String(((await readJson(request)) ?? {}).name ?? ""))));
}

/** DELETE /api/admin/categories/{id}[?confirm=true] — A-05·D-12: 판매 중 연결 409 HAS_ON_SALE, 판매 중지만 남으면 confirm 후 미분류 이동, 미분류 403 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  return adminRoute(async () => ok(await deleteCategory((await ctx.params).id, new URL(request.url).searchParams.get("confirm") === "true")));
}
