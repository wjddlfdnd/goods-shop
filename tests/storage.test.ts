import { afterEach, describe, expect, it, vi } from "vitest";

// 10단계: 배포(Vercel)는 Blob, 개발·테스트는 로컬 uploads/ 폴더(LEDGER #113)
const put = vi.fn(async (pathname: string) => ({ url: `https://store.public.blob.vercel-storage.com/${pathname}` }));
const del = vi.fn(async () => {});
vi.mock("@vercel/blob", () => ({ put, del }));

describe("이미지 저장소", () => {
  afterEach(() => { vi.unstubAllEnvs(); put.mockClear(); del.mockClear(); });

  it("Blob 토큰이 있으면 Blob에 올리고 Blob URL을 저장·삭제한다", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test");
    const { saveImage, removeImage } = await import("@/lib/storage");
    const url = await saveImage("a.png", Buffer.from("x"), "image/png");
    expect(put).toHaveBeenCalledWith("products/a.png", expect.any(Buffer), expect.objectContaining({ access: "public", contentType: "image/png" }));
    expect(url).toBe("https://store.public.blob.vercel-storage.com/products/a.png");
    await removeImage(url);
    expect(del).toHaveBeenCalledWith(url);
  });

  it("토큰이 없으면 로컬에 저장하고, 시드 이미지·다른 주소는 지우지 않는다", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const { saveImage, removeImage } = await import("@/lib/storage");
    const url = await saveImage("storage-test.png", Buffer.from("x"), "image/png");
    expect(url).toBe("/uploads/storage-test.png");
    expect(put).not.toHaveBeenCalled();
    await removeImage(url);
    await removeImage("/images/products/keyring.svg");
    await removeImage("https://example.com/x.png");
    expect(del).not.toHaveBeenCalled();
  });
});
