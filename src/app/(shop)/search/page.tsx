import { Suspense } from "react";
import { connection } from "next/server";
import { listProducts, parseSort, type Sort } from "@/lib/catalog";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortMenu } from "@/components/catalog/SortMenu";
import { EmptyState, Icon } from "@/components/ui";

// 상품 검색(P-05): 상품명 포함 검색. 빈 검색어·공백뿐이면 검색하지 않고 안내(v1.2)
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <MobileSubHeader back="/" title="상품 검색" />
      <main className="page container">
        <h1 className="page-title heading-lg-mobile only-desktop">상품 검색</h1>
        <Suspense fallback={<SearchForm />}><Results searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}

function SearchForm({ q = "", error }: { q?: string; error?: string }) {
  return (
    <form role="search" aria-label="상품 검색" action="/search" className="mt-4" style={{ maxWidth: "calc(var(--grid-mobile-width) * 1.5)" }}>
      <div className={error ? "gs-field" : undefined}>
        <div className={`gs-search gs-search--l${error ? " gs-search--error" : ""}`}>
          <label className="gs-sr" htmlFor="q">상품명 검색어</label>
          <span className="gs-search__icon" aria-hidden="true"><Icon name="search" size={20} /></span>
          <input id="q" name="q" type="search" enterKeyHint="search" className="gs-search__input" placeholder="상품명으로 검색" defaultValue={q}
            aria-invalid={error ? true : undefined} aria-describedby={error ? "q-error" : undefined} />
        </div>
        {error ? <p id="q-error" className="gs-field__error gs-search__error" role="alert">{error}</p> : <p className="caption text-sub">상품명으로 검색합니다. 입력 후 Enter를 누르세요.</p>}
      </div>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  if (typeof sp.q !== "string") return <SearchForm />;
  const q = sp.q.trim();
  if (!q) return <SearchForm q={sp.q} error="검색어를 입력해 주세요" />;
  const sort = parseSort(sp.sort);
  const products = await listProducts({ q, sort });
  const hrefFor = (s: Sort) => `/search?${new URLSearchParams({ q, sort: s })}`;
  return (
    <>
      <SearchForm q={q} />
      <div className="list-head mt-8">
        <p className="body-sm-14 text-sub m-0">&apos;{q}&apos; 검색 결과 <b className="text-ink">{products.length}</b>개</p>
        {products.length ? <SortMenu current={sort} hrefFor={hrefFor} /> : null}
      </div>
      {products.length ? <ProductGrid products={products} /> : (
        <EmptyState title={`'${q}'에 맞는 상품이 없습니다`} text="검색어를 줄이거나 다른 상품명으로 다시 검색해 보세요." actionText="전체 상품 보기" href="/products" />
      )}
    </>
  );
}
