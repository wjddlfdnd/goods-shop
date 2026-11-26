// 상품 이미지 저장소(A-03, 기술 설계서 8장). 배포(Vercel)는 파일 시스템이 사라지므로 Vercel Blob에,
// 개발·테스트는 로컬 uploads/ 폴더에 저장한다. BLOB_READ_WRITE_TOKEN이 있으면 Blob을 쓴다.
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** 이미지를 저장하고 화면에서 쓸 URL을 돌려준다 */
export async function saveImage(name: string, body: Buffer, contentType: string): Promise<string> {
  if (blobEnabled()) {
    const blob = await put(`products/${name}`, body, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), body);
  return `/uploads/${name}`;
}

/** 업로드한 이미지만 지운다. 시드 이미지(public/images)는 지우지 않는다. 실패해도 주문·상품 처리는 막지 않는다 */
export async function removeImage(url: string) {
  if (url.startsWith("/uploads/")) {
    await unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
  } else if (blobEnabled() && /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) {
    await del(url).catch(() => {});
  }
}
