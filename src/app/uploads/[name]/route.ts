import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/storage";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** GET /uploads/{파일} — 관리자가 올린 상품 이미지(개발용 로컬 저장, 배포는 Blob URL을 직접 씀, A-03) */
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[name]">) {
  const name = path.basename((await ctx.params).name);
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(body), { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
