// 사용자 화면 헤더. 데스크톱(768 이상) = 로고 + 카테고리 탭 + 검색·계정·장바구니,
// 모바일 = 홈형(로고 + 아이콘) 또는 하위 화면형(뒤로 + 제목 + 장바구니). DESIGN 4장.
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listCategories } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";
import { IconButton, CategoryTabs } from "../ui";
import { CategoryNav } from "./CategoryNav";

async function Actions({ withSearch = true, cartOnly = false }: { withSearch?: boolean; cartOnly?: boolean }) {
  const { user, cartCount } = await getViewer();
  if (cartOnly) return <IconButton icon="cart" label="장바구니" href="/cart" badge={cartCount} />;
  return (
    <>
      {withSearch ? <IconButton icon="search" label="검색" href="/search" /> : null}
      <IconButton icon="user" label={user ? `${user.name}님 계정` : "로그인"} href={user ? "/account" : "/login"} />
      <IconButton icon="cart" label="장바구니" href="/cart" badge={cartCount} />
    </>
  );
}

const StaticActions = ({ cartOnly }: { cartOnly?: boolean }) => (cartOnly
  ? <IconButton icon="cart" label="장바구니" href="/cart" />
  : (<><IconButton icon="search" label="검색" href="/search" /><IconButton icon="user" label="로그인" href="/login" /><IconButton icon="cart" label="장바구니" href="/cart" /></>));

async function DesktopCategories() {
  await connection();
  const categories = await listCategories();
  return <Suspense fallback={<CategoryTabs items={[]} flush />}><CategoryNav categories={categories} /></Suspense>;
}

export function DesktopHeader() {
  return (
    <header className="gs-dheader only-desktop">
      <div className="gs-dheader__in container">
        <Link className="gs-logo" href="/">FANDOM PICK</Link>
        <Suspense fallback={<nav className="gs-tabs gs-tabs--flush" aria-label="카테고리" />}><DesktopCategories /></Suspense>
        <div className="gs-dheader__actions"><Suspense fallback={<StaticActions />}><Actions /></Suspense></div>
      </div>
    </header>
  );
}

/** 모바일 홈형 헤더(홈·목록·주문 완료) + 선택적으로 카테고리 탭 */
export function MobileHomeHeader({ tabs = false }: { tabs?: boolean }) {
  return (
    <div className="only-mobile">
      <header className="gs-header">
        <p className="gs-header__title" style={{ flex: 1 }}><Link className="gs-logo" href="/">FANDOM PICK</Link></p>
        <Suspense fallback={<StaticActions />}><Actions /></Suspense>
      </header>
      {tabs ? <Suspense fallback={null}><MobileTabs /></Suspense> : null}
    </div>
  );
}

async function MobileTabs() {
  await connection();
  const categories = await listCategories();
  return <Suspense fallback={null}><CategoryNav categories={categories} flush={false} /></Suspense>;
}

/** 모바일 하위 화면형 헤더: 뒤로 + 제목(본문에 큰 제목이 있으면 비움) + 장바구니 */
export function MobileSubHeader({ back, title, cart = true }: { back: string; title?: string; cart?: boolean }) {
  return (
    <header className="gs-header gs-header--back only-mobile">
      <IconButton icon="back" label="뒤로" href={back} />
      <p className="gs-header__title">{title ?? ""}</p>
      {cart ? <Suspense fallback={<StaticActions cartOnly />}><Actions cartOnly /></Suspense> : null}
    </header>
  );
}
