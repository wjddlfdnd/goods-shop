import { getSessionUser } from "@/lib/auth";
import { CartError, setCartQuantity } from "@/lib/cart";
import { cartFail, fail, ok, readJson } from "@/lib/api";

/** PATCH /api/cart/{itemId} — O-02: { quantity }. 1 미만은 1로, 재고 초과는 409(7.3) */
export async function PATCH(request: Request, ctx: RouteContext<"/api/cart/[itemId]">) {
  const user = await getSessionUser();
  if (!user) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  const { itemId } = await ctx.params;
  const body = (await readJson(request)) ?? {};
  try {
    return ok(await setCartQuantity(user.id, itemId, Number(body.quantity)));
  } catch (e) {
    if (e instanceof CartError) return cartFail(e);
    throw e;
  }
}
