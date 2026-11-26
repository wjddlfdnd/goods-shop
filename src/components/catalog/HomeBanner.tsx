"use client";
// 메인 배너(P-01, D-15): 코드에 고정된 이미지 3장, 관리 기능 없음. 문구는 가정(LEDGER #98).
import Link from "next/link";
import { useState } from "react";
import { IconButton, Label } from "../ui";

const SLIDES = [
  { tag: "THIS WEEK", title: "겨울 신상 굿즈 도착", link: "신상품 보기", href: "/products?sort=latest", img: "/images/banners/banner-1.svg", alt: "엽서·키링·스티커 신상품 모음 이미지" },
  { tag: "BEST", title: "팬덤이 고른 인기 굿즈", link: "인기순 보기", href: "/products?sort=popular", img: "/images/banners/banner-2.svg", alt: "인기 굿즈 모음 이미지" },
  { tag: "FREE", title: "모든 주문 배송비 0원", link: "전체 상품 보기", href: "/products", img: "/images/banners/banner-3.svg", alt: "배송비 0원 안내 이미지" },
];

export function HomeBanner() {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const go = (d: number) => setI((i + d + SLIDES.length) % SLIDES.length);
  return (
    <section className="banner" aria-roledescription="carousel" aria-label="메인 배너">
      <div className="banner__img" role="img" aria-label={s.alt}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 고정 SVG 배너 */}
        <img src={s.img} alt="" />
      </div>
      <div className="stack-4" aria-live="polite">
        <div><Label kind="best">{s.tag}</Label></div>
        <h2 className="heading-lg-mobile m-0 text-ink">{s.title}</h2>
        <div className="row row--between">
          <Link href={s.href} className="gs-link gs-link--strong"><span>{s.link} →</span></Link>
          <div className="row">
            <IconButton icon="back" label="이전 배너" onClick={() => go(-1)} />
            <span className="caption">{i + 1} / {SLIDES.length}</span>
            <IconButton icon="chevron-right" label="다음 배너" onClick={() => go(1)} />
          </div>
        </div>
      </div>
    </section>
  );
}
