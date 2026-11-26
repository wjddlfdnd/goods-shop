import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCategory, listProducts, parseSort, type Sort } from "@/lib/catalog";
import { MobileHomeHeader } from "@/components/layout/SiteHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortMenu } from "@/components/catalog/SortMenu";
import { EmptyState } from "@/components/ui";

// 상품 목록(P-02·P-03·P-04): /products?category=<id>&sort=<정렬>
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <MobileHomeHeader tabs />
      <main className="page container">
        <Suspense fallback={<p className="caption mt-8">불러오는 중…</p>}><List searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const categoryId = typeof sp.category === "string" ? sp.category : undefined;
  const sort = parseSort(sp.sort);
  const category = categoryId ? await getCategory(categoryId) : null;
  if (categoryId && !category) notFound(); // 없는 카테고리·미분류
  const products = await listProducts({ categoryId, sort });
  const hrefFor = (s: Sort) => `/products?${new URLSearchParams({ ...(categoryId ? { category: categoryId } : {}), sort: s })}`;
  return (
    <>
      <ol className="crumbs body-sm-13 only-desktop"><li><Link href="/">홈</Link></li><li aria-current="page">{category?.name ?? "전체 상품"}</li></ol>
      <h1 className="page-title heading-xl-mobile">{category?.name ?? "전체 상품"}</h1>
      <div className="list-head">
        <p className="body-sm-14 text-sub m-0">상품 <b className="text-ink">{products.length}</b>개</p>
        <SortMenu current={sort} hrefFor={hrefFor} />
      </div>
      {products.length ? <ProductGrid products={products} /> : (
        <EmptyState title="이 카테고리에 판매 중인 상품이 없습니다" text="다른 카테고리를 둘러보거나 전체 상품을 확인해 보세요." actionText="전체 상품 보기" href="/products" />
      )}
    </>
  );
}
