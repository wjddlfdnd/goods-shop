import { connection } from "next/server";
import { addWish, listWishlist, removeWish, WishError } from "@/lib/wishlist";
import { fail, memberRoute, ok, readJson } from "@/lib/api";

/** GET /api/me/wishlist — U-06 */
export async function GET() {
  await connection();
  return memberRoute(async (u) => ok(await listWishlist(u.id)));
}

/** POST /api/me/wishlist — U-06: { productId }, 같은 조합은 1건 */
export async function POST(request: Request) {
  return memberRoute(async (u) => {
    const productId = String(((await readJson(request)) ?? {}).productId ?? "");
    try { await addWish(u.id, productId); } catch (e) { if (e instanceof WishError) return fail(e.status, e.code, e.message); throw e; }
    return ok({ productId, wished: true }, 201);
  });
}

/** DELETE /api/me/wishlist — U-06: { productId } */
export async function DELETE(request: Request) {
  return memberRoute(async (u) => {
    const productId = String(((await readJson(request)) ?? {}).productId ?? "");
    await removeWish(u.id, productId);
    return ok({ productId, wished: false });
  });
}
