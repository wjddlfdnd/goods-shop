import { addImages, deleteImage } from "@/lib/admin";
import { adminRoute, fail, ok } from "@/lib/api";

/** POST /api/admin/products/{id}/images — A-03: multipart images[] (jpg/png/webp, 5MB, 최대 10장) */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/products/[id]/images">) {
  return adminRoute(async () => {
    const form = await request.formData().catch(() => null);
    if (!form) return fail(400, "NO_FILE", "올릴 이미지를 골라 주세요.");
    const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    await addImages((await ctx.params).id, files);
    return ok({ uploaded: files.length }, 201);
  });
}

/** DELETE /api/admin/products/{id}/images?imageId= — A-03: 대표를 지우면 다음 장이 대표 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/products/[id]/images">) {
  return adminRoute(async () => {
    const imageId = new URL(request.url).searchParams.get("imageId") ?? "";
    await deleteImage((await ctx.params).id, imageId);
    return ok({ deleted: true });
  });
}
