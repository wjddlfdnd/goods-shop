"use client";
// 상품 이미지(A-03): 첫 장이 대표(목록 썸네일), 나머지는 상세. 상품당 10장·장당 5MB·jpg/png/webp(가정)
import { useActionState, useTransition } from "react";
import { deleteImageAction, uploadImagesAction, type AdminState } from "@/lib/actions/admin";
import { Button, Notice } from "../ui";

export function ImagePanel({ productId, images }: { productId: string; images: { id: string; url: string; kind: "MAIN" | "DETAIL" }[] }) {
  const [state, upload, pending] = useActionState<AdminState, FormData>(uploadImagesAction.bind(null, productId), undefined);
  const [deleting, start] = useTransition();
  return (
    <section className="stack-4" aria-label="이미지">
      <h3 className="heading-xs m-0">이미지 <span className="body-sm-13 text-sub">{images.length}/10장</span></h3>
      <form action={upload} className="stack-2">
        <label className="gs-field__label" htmlFor="img-files">이미지를 끌어 놓거나 파일을 고르세요</label>
        <input id="img-files" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="body-sm-14" />
        <div><Button type="submit" size="S" icon="plus" disabled={pending}>{pending ? "올리는 중…" : "이미지 업로드"}</Button></div>
        <p className="caption text-sub m-0">jpg·png·webp, 한 장에 5MB 이하, 상품당 10장까지</p>
      </form>
      {state?.message ? <Notice live tone="danger">{state.message}</Notice> : state?.ok ? <Notice live>{state.ok}</Notice> : null}
      <ul className="m-0" style={{ padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)" }} aria-label={`업로드한 이미지 ${images.length}장`}>
        {images.map((img, i) => (
          <li key={img.id} className="stack-2" style={{ gap: "var(--space-1)" }}>
            <div className="line-item__thumb" style={{ width: "100%", height: "auto", aspectRatio: "4 / 5" }} role="img" aria-label={img.kind === "MAIN" ? "대표 이미지" : `상세 이미지 ${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" />
            </div>
            <div className="row row--between">
              <span className="caption">{img.kind === "MAIN" ? <b>대표</b> : `상세 ${i}`}</span>
              <Button size="S" variant="ghost" disabled={deleting} onClick={() => start(async () => { await deleteImageAction(productId, img.id); })}>삭제</Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="caption text-sub m-0">첫 장이 대표 이미지(목록 썸네일)가 되고, 나머지는 상세 이미지로 보입니다. 대표를 지우면 다음 장이 대표가 됩니다.</p>
    </section>
  );
}
