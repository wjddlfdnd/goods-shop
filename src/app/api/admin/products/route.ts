import { connection } from "next/server";
import { listAdminProducts, productSchema, saveProduct } from "@/lib/admin";
import { fieldErrors } from "@/lib/validation";
import { adminRoute, fail, ok, readJson } from "@/lib/api";

/** GET /api/admin/products — A-02: category(미분류 포함)·status·q·page(20개씩) */
export async function GET(request: Request) {
  await connection();
  return adminRoute(async () => {
    const sp = new URL(request.url).searchParams;
    const status = sp.get("status");
    return ok(await listAdminProducts({ categoryId: sp.get("category") || undefined, status: status === "ON_SALE" || status === "STOPPED" ? status : undefined, q: sp.get("q") || undefined, page: Number(sp.get("page")) || 1 }));
  });
}

/** POST /api/admin/products — A-02·A-04: 상품 + options(없으면 기본 옵션) */
export async function POST(request: Request) {
  return adminRoute(async () => {
    const parsed = productSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return fail(400, "INVALID_INPUT", "입력값을 확인해 주세요.", { fields: fieldErrors(parsed.error) });
    return ok(await saveProduct(null, parsed.data), 201);
  });
}
