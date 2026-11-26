"use client";
// 상품 이미지 캐러셀 + 데스크톱 썸네일(P-06). 대표 이미지가 첫 장(A-03).
import { useState } from "react";


export function Gallery({ name, images }: { name: string; images: string[] }) {
  const [cur, setCur] = useState(0);
  const n = Math.max(images.length, 1);
  return (
    <div>
      <section className="gs-carousel gs-carousel--rounded" aria-roledescription="carousel" aria-label={`${name} 이미지`}>
        <div className="gs-carousel__slide" role="group" aria-roledescription="slide" aria-label={`${cur + 1} / ${n}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 업로드 이미지 URL */}
          {images.length ? <img src={images[cur]} alt="" /> : <span className="caption">[상품 이미지]</span>}
        </div>
        {n > 1 ? <div className="gs-dots gs-carousel__dots gs-dots--on-light" aria-hidden="true">{images.map((_, i) => <i key={i} aria-current={i === cur ? "true" : undefined} />)}</div> : null}
      </section>
      {n > 1 ? (
        <div className="thumbs" role="group" aria-label="이미지 선택">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {images.map((src, i) => <button key={i} type="button" aria-label={`상품 이미지 ${i + 1} 보기`} aria-current={i === cur ? "true" : undefined} onClick={() => setCur(i)}><img src={src} alt="" /></button>)}
        </div>
      ) : null}
    </div>
  );
}
