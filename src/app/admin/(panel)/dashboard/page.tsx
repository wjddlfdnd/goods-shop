import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { salesSummary } from "@/lib/admin-orders";
import { won } from "@/lib/format";

// 판매 현황 요약(A-08, 2차): 숫자 타일 3개. 총 주문 수·총매출은 주문 취소 제외(7.9)
export default function DashboardPage() {
  return (
    <div className="stack-8">
      <div>
        <h1 className="heading-sm-desktop m-0">대시보드</h1>
        <p className="body-sm-14 text-sub m-0">판매 현황 요약 · 주문 취소는 집계에서 뺍니다</p>
      </div>
      <Suspense fallback={<p className="caption">불러오는 중…</p>}><Tiles /></Suspense>
    </div>
  );
}

async function Tiles() {
  await connection();
  const s = await salesSummary();
  const tiles = [
    { label: "총 주문 수", value: `${s.orderCount.toLocaleString("ko-KR")}건`, href: "/admin/orders", note: "결제 완료·배송 준비·배송 중·배송 완료" },
    { label: "총매출", value: won(s.revenue), href: "/admin/orders", note: "주문 취소 제외 결제 금액 합계" },
    { label: "판매 중 상품 수", value: `${s.onSaleProducts.toLocaleString("ko-KR")}개`, href: "/admin/products?status=ON_SALE", note: "판매 상태가 판매 중인 상품" },
  ];
  return (
    <dl className="stat-tiles m-0">
      {tiles.map((t) => (
        <div key={t.label} className="gs-panel stat-tile">
          <dt className="body-sm-14 text-sub">{t.label}</dt>
          <dd className="stat-tile__value heading-sm-desktop m-0">{t.value}</dd>
          <dd className="caption text-sub m-0">{t.note} · <Link className="gs-link" href={t.href}>보기</Link></dd>
        </div>
      ))}
    </dl>
  );
}
