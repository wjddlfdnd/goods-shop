import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { Gallery } from "@/components/catalog/Gallery";
import { PurchasePanel } from "@/components/catalog/PurchasePanel";
import { InfoPill, Label, Notice, SectionHeader } from "@/components/ui";
import { eulReul, won } from "@/lib/format";

// 상품 상세(P-06·P-07). 판매 중지 상품도 보여 주되 담기·구매는 막는다(7.2). 없는 상품은 찾을 수 없음(7.10)
export default function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  return (
    <>
      <MobileSubHeader back="/products" title="상품 보기" />
      <main className="page page--sticky container">
        <Suspense fallback={<p className="caption mt-8">불러오는 중…</p>}><Detail params={params} searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}

const INTENT_NOTICE: Record<string, string> = {
  SOLD_OUT: "로그인하는 동안 고른 옵션이 품절되어 장바구니에 담지 못했습니다.",
  OVER_STOCK: "로그인하는 동안 재고가 줄어 고른 수량을 담지 못했습니다. 수량을 다시 골라 주세요.",
  UNAVAILABLE: "로그인하는 동안 판매가 중지되어 장바구니에 담지 못했습니다.",
};

async function Detail({ params, searchParams }: { params: PageProps<"/products/[id]">["params"]; searchParams: PageProps<"/products/[id]">["searchParams"] }) {
  await connection(); // 재고·판매 상태는 요청 시점 데이터
  const { id } = await params;
  const { notice } = await searchParams;
  const p = await getProduct(id);
  if (!p) notFound();
  const stopped = p.status === "STOPPED";
  const soldOut = p.options.every((o) => o.stock === 0);
  const main = p.images.filter((i) => i.kind === "MAIN").map((i) => i.url);
  const details = p.images.filter((i) => i.kind === "DETAIL").map((i) => i.url);
  const visibleCategory = p.category.isSystem ? null : p.category; // 미분류는 노출하지 않는다(D-12)
  const optionCount = p.options.length === 1 && p.options[0].isDefault ? 0 : p.options.length;
  const soldOutNames = p.options.filter((o) => o.stock === 0).map((o) => o.name);

  return (
    <>
      <ol className="crumbs body-sm-13 only-desktop">
        <li><Link href="/">홈</Link></li>
        {visibleCategory ? <li><Link href={`/products?category=${visibleCategory.id}`}>{visibleCategory.name}</Link></li> : null}
        <li aria-current="page">{p.name}</li>
      </ol>
      <div className="split split--half mt-6">
        <Gallery name={p.name} images={[...main, ...details]} />
        <section aria-label="상품 정보" className="stack-6">
          <div className="stack-4">
            <div className="row" style={{ flexWrap: "wrap" }}>
              {stopped ? <Label kind="stopped" /> : soldOut ? <Label kind="soldout" /> : p.isNew ? <Label kind="new" /> : null}
              <InfoPill>무료배송</InfoPill>
              {optionCount ? <InfoPill>옵션 {optionCount}개</InfoPill> : null}
              {visibleCategory ? <InfoPill>{visibleCategory.name}</InfoPill> : null}
            </div>
            <h1 className="heading-xl-mobile m-0 text-ink">{p.name}</h1>
            <p className="price-detail m-0 text-ink">{won(p.price)}</p>
            <p className="body-15 m-0" style={{ whiteSpace: "pre-line" }}>{p.description}</p>
          </div>
          {typeof notice === "string" && INTENT_NOTICE[notice] ? <Notice live tone="danger">{INTENT_NOTICE[notice]}</Notice> : null}
          {stopped ? (
            <Notice live>
              <strong className="text-ink">판매가 중지된 상품입니다.</strong><br />장바구니에 담거나 바로 구매할 수 없습니다.
              {visibleCategory ? <> 다른 {eulReul(visibleCategory.name)} 둘러보세요. <Link className="gs-link gs-link--strong" href={`/products?category=${visibleCategory.id}`}>{visibleCategory.name} 보러 가기 →</Link></> : null}
            </Notice>
          ) : soldOut ? (
            <Notice live><strong className="text-ink">모든 옵션이 품절되었습니다.</strong><br />지금은 장바구니에 담거나 구매할 수 없습니다.</Notice>
          ) : null}
          <div className="stack-4">
            <h2 className="heading-xs m-0">{optionCount ? "옵션 선택" : "수량 선택"}</h2>
            <PurchasePanel product={p} back={`/products/${p.id}`} />
          </div>
          <div className="stack-4">
            <h2 className="heading-xs m-0">배송 안내</h2>
            <Notice><b>배송비 0원</b><br />모든 주문은 배송비 없이 보내 드립니다.</Notice>
          </div>
          <dl className="gs-surface body-sm-14 stack-2 m-0 only-desktop" aria-label="판매 정보">
            {visibleCategory ? <div className="row row--between"><dt className="text-sub">카테고리</dt><dd className="m-0">{visibleCategory.name}</dd></div> : null}
            <div className="row row--between"><dt className="text-sub">옵션</dt><dd className="m-0">{optionCount ? `${optionCount}개${soldOutNames.length ? ` (${soldOutNames.join(", ")} 품절)` : ""}` : "기본 구성"}</dd></div>
            <div className="row row--between"><dt className="text-sub">배송비</dt><dd className="m-0">0원</dd></div>
            <div className="row row--between"><dt className="text-sub">판매 상태</dt><dd className="m-0">{stopped ? "판매 중지" : "판매 중"}</dd></div>
          </dl>
        </section>
      </div>
      {details.length ? (
        <section aria-label="상품 설명" className="mt-12">
          <SectionHeader title="상품 설명" />
          <div className="card-grid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {details.map((src, i) => <div key={src + i} className="gs-card__img" role="img" aria-label={`${p.name} 상세 이미지 ${i + 1}`}><img src={src} alt="" /></div>)}
          </div>
        </section>
      ) : null}
    </>
  );
}
