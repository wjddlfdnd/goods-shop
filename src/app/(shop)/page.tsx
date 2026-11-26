import { Suspense } from "react";
import { connection } from "next/server";
import { listProducts } from "@/lib/catalog";
import { MobileHomeHeader } from "@/components/layout/SiteHeader";
import { ProductCard, SectionHeader, won } from "@/components/ui";

// 홈(P-01). feature-catalog에서 배너·인기 상품·카테고리 영역을 채운다.
export default function Home() {
  return (
    <>
      <MobileHomeHeader tabs />
      <main className="page container">
        <section className="mt-8">
          <SectionHeader title="신상품" linkText="전체 보기" href="/products" />
          <Suspense fallback={<p className="caption">불러오는 중…</p>}>
            <NewProducts />
          </Suspense>
        </section>
      </main>
    </>
  );
}

async function NewProducts() {
  await connection(); // 재고·판매 상태는 요청 시점 데이터
  const products = await listProducts({ take: 8 });
  return (
    <div className="card-grid">
      {products.map((p) => (
        <ProductCard key={p.id} href={`/products/${p.id}`} name={p.name} price={won(p.price)} imageUrl={p.imageUrl} label={p.soldOut ? "soldout" : undefined} />
      ))}
    </div>
  );
}
