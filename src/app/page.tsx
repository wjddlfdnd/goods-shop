import { Suspense } from "react";
import { connection } from "next/server";
import { listCategories, listProducts, won } from "@/lib/catalog";

// 7단계 확인용 홈: DB의 기본 데이터(카테고리·신상품)를 조회해 보여 준다. 화면 완성은 8단계.
export default function Home() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-16)" }}>
      <h1 className="heading-lg-mobile" style={{ margin: 0, color: "var(--text)" }}>GOODS SHOP</h1>
      <p className="body-sm-14" style={{ color: "var(--text-sub)" }}>7단계 개발 환경 확인 화면 — 데이터는 로컬 PostgreSQL 시드에서 읽습니다.</p>
      <Suspense fallback={<p className="caption">불러오는 중…</p>}>
        <CatalogPreview />
      </Suspense>
    </main>
  );
}

async function CatalogPreview() {
  await connection(); // 재고·판매 상태는 요청 시점 데이터
  const [categories, products] = await Promise.all([listCategories(), listProducts({ take: 8 })]);
  return (
    <>
      <nav aria-label="카테고리" className="gs-tabs gs-tabs--flush" style={{ marginTop: "var(--space-6)" }}>
        {categories.map((c) => (
          <span key={c.id} className="gs-tab">{c.name}</span>
        ))}
      </nav>
      <section style={{ marginTop: "var(--space-12)" }}>
        <div className="gs-section-head"><h2>신상품</h2></div>
        <div className="gs-card-grid gs-card-grid--desktop">
          {products.map((p) => (
            <div key={p.id} className="gs-card">
              <div className="gs-card__img" role="img" aria-label={p.name}>
                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : "[상품 이미지]"}
              </div>
              <div className="gs-card__meta">
                {p.soldOut ? <span className="gs-label gs-label--soldout">품절</span> : null}
                <span className="gs-card__name">{p.name}</span>
                <span className="gs-card__price">{won(p.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
