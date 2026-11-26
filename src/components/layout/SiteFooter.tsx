// 사용자 화면 푸터. 데스크톱 = 정보 블록 5개 + 한 줄 안내, 모바일 = 한 줄 안내(DESIGN 4.1).
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listCategories } from "@/lib/catalog";

async function FooterCategories() {
  await connection();
  const categories = await listCategories();
  return <ul>{categories.map((c) => <li key={c.id}><Link className="body-sm-14" href={`/products?category=${c.id}`}>{c.name}</Link></li>)}</ul>;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="stack-2">
            <Link className="logo-desktop gs-logo text-ink" href="/">FANDOM PICK</Link>
            <p className="body-sm-14 m-0">팬덤이 직접 고른 추천 굿즈를 모은<br />연습용 쇼핑몰입니다.</p>
          </div>
          <nav aria-label="푸터 카테고리"><h2 className="body-sm-14">카테고리</h2><Suspense fallback={null}><FooterCategories /></Suspense></nav>
          <nav aria-label="푸터 쇼핑"><h2 className="body-sm-14">쇼핑</h2><ul><li><Link className="body-sm-14" href="/search">상품 검색</Link></li><li><Link className="body-sm-14" href="/cart">장바구니</Link></li></ul></nav>
          <nav aria-label="푸터 회원"><h2 className="body-sm-14">회원</h2><ul><li><Link className="body-sm-14" href="/login">로그인</Link></li><li><Link className="body-sm-14" href="/signup">회원가입</Link></li></ul></nav>
          <div><h2 className="body-sm-14">이용 안내</h2><ul className="body-sm-14"><li>모든 주문 배송비 0원</li><li>모의 결제, 실제 결제 없음</li></ul></div>
        </div>
        <p className="caption site-footer__caption">FANDOM PICK · 연습용 프로젝트, 실제 결제 없음 · 배송비 0원</p>
      </div>
    </footer>
  );
}
