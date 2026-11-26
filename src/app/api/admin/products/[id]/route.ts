import { deleteProduct, getAdminProduct, productSchema, saveProduct } from "@/lib/admin";
import { fieldErrors } from "@/lib/validation";
import { adminRoute, fail, ok, readJson } from "@/lib/api";

/** PATCH /api/admin/products/{id} — A-02·A-04 부분 수정(주지 않은 값은 현재 값 유지) */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  return adminRoute(async () => {
    const { id } = await ctx.params;
    const cur = await getAdminProduct(id);
    if (!cur) return fail(404, "NOT_FOUND", "상품을 찾을 수 없습니다.");
    const body = (await readJson(request)) ?? {};
    const def = cur.options.find((o) => o.isDefault);
    const merged = {
      name: cur.name, price: cur.price, description: cur.description, categoryId: cur.categoryId, status: cur.status,
      options: def ? [] : cur.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extraPrice, stock: o.stock })), defaultStock: def?.stock ?? 0,
      ...body,
    };
    const parsed = productSchema.safeParse(merged);
    if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
    return ok(await saveProduct(id, parsed.data));
  });
}

/** DELETE /api/admin/products/{id} — A-02: 주문 이력이 있으면 409 HAS_ORDERS(판매 중지만) */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  return adminRoute(async () => { await deleteProduct((await ctx.params).id); return ok({ deleted: true }); });
}
