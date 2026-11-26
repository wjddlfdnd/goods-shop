import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listCategories, listProducts } from "@/lib/catalog";
import { getSessionUser } from "@/lib/auth";
import { wishedIds } from "@/lib/wishlist";
import { MobileHomeHeader } from "@/components/layout/SiteHeader";
import { HomeBanner } from "@/components/catalog/HomeBanner";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Icon, Notice, SectionHeader } from "@/components/ui";

// 홈(P-01): 메인 배너 · 신상품 8 · 인기 상품 8 · 카테고리
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <MobileHomeHeader tabs />
      <main className="page container">
        <h1 className="sr-only">FANDOM PICK 홈 — 팬덤이 직접 고른 추천템</h1>
        <Suspense fallback={null}><AdminOnlyNotice searchParams={searchParams} /></Suspense>
        <div className="mt-6"><HomeBanner /></div>
        <Suspense fallback={<p className="caption mt-8">불러오는 중…</p>}>
          <Sections />
        </Suspense>
      </main>
    </>
  );
}

async function Sections() {
  await connection(); // 재고·판매 상태·주문 집계는 요청 시점 데이터
  const user = await getSessionUser();
  const [fresh, popular, categories, wished] = await Promise.all([
    listProducts({ sort: "latest", take: 8 }),
    listProducts({ sort: "popular", take: 8 }), // 집계 대상 주문 0건이면 최신순과 같다(7.10)
    listCategories(),
    wishedIds(user?.id),
  ]);
  return (
    <>
      {fresh.length > 0 ? ( // 판매 중 상품 0건이면 영역을 숨긴다(7.10)
        <section className="mt-12">
          <SectionHeader title="신상품" linkText="전체 보기" href="/products" />
          <ProductGrid products={fresh} wished={wished} />
        </section>
      ) : null}
      {popular.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title="인기 상품" linkText="인기순 보기" href="/products?sort=popular" />
          <ProductGrid products={popular} ranked wished={wished} />
        </section>
      ) : null}
      <section className="mt-12">
        <SectionHeader title="카테고리" />
        <nav className="cat-grid" aria-label="카테고리 바로가기">
          {categories.map((c) => <Link key={c.id} href={`/products?category=${c.id}`} className="body-sm-14"><span>{c.name}</span><Icon name="chevron-right" size={20} /></Link>)}
        </nav>
      </section>
    </>
  );
}

// 관리자 화면 접근 거부 후 안내(A-01, PRD v1.3·v1.7): 회원·비회원 같은 문구
async function AdminOnlyNotice({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { notice } = await searchParams;
  if (notice !== "admin-only") return null;
  return (
    <div className="mt-6">
      <Notice live><strong className="text-ink">관리자만 들어갈 수 있는 페이지입니다.</strong><br />관리자 계정으로 로그인해야 쓸 수 있어 홈으로 이동했습니다.</Notice>
    </div>
  );
}
