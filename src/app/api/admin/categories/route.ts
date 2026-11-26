import { connection } from "next/server";
import { createCategory, listAdminCategories } from "@/lib/admin";
import { adminRoute, ok, readJson } from "@/lib/api";

/** GET /api/admin/categories — A-05: 미분류 포함, 판매 중·판매 중지 상품 수 */
export async function GET() {
  await connection();
  return adminRoute(async () => ok(await listAdminCategories()));
}

/** POST /api/admin/categories — A-05: { name }, 이름 중복 409 */
export async function POST(request: Request) {
  return adminRoute(async () => ok(await createCategory(String(((await readJson(request)) ?? {}).name ?? "")), 201));
}
