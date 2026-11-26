import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { CancelOrder } from "@/components/account/CancelOrder";
import { Button, Notice, OrderSummary, SectionHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { getOrder } from "@/lib/order";
import { PAY_LABEL, STATUS_LABEL } from "@/lib/order-status";
import { formatPhone, won } from "@/lib/format";

// 주문 상세(U-05·D-4, 2차) + 주문 취소(O-07): 결제 완료일 때만 취소 버튼
export default function OrderDetailPage({ params, searchParams }: PageProps<"/account/orders/[orderNumber]">) {
  return (
    <>
      <MobileSubHeader back="/account/orders" title="주문 상세" />
      <main className="page container">
        <div className="form-card" style={{ maxWidth: "calc(var(--grid-mobile-width) * 1.6)" }}>
          <h1 className="page-title heading-lg-mobile sr-only-mobile">주문 상세</h1>
          <Suspense fallback={<p className="caption">불러오는 중…</p>}><Detail params={params} searchParams={searchParams} /></Suspense>
        </div>
      </main>
    </>
  );
}

async function Detail({ params, searchParams }: { params: PageProps<"/account/orders/[orderNumber]">["params"]; searchParams: PageProps<"/account/orders/[orderNumber]">["searchParams"] }) {
  const { orderNumber } = await params;
  const { canceled } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/account/orders/${orderNumber}`);
  const o = await getOrder(user.id, orderNumber);
  if (!o) notFound();
  return (
    <div className="stack-8 mt-6">
      {canceled && o.status === "CANCELED" ? <Notice live>주문을 취소했습니다. 주문한 수량만큼 재고를 되돌렸습니다.</Notice> : null}
      <section className="gs-surface stack-2">
        <div className="row row--between"><span className="body-sm-14 text-sub">주문 번호</span><b className="text-ink">{o.orderNumber}</b></div>
        <div className="row row--between"><span className="body-sm-14 text-sub">주문일시</span><span className="body-sm-14">{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(o.createdAt)}</span></div>
        <div className="row row--between"><span className="body-sm-14 text-sub">주문 상태</span><b className={o.status === "CANCELED" ? "text-danger" : "text-ink"}>{STATUS_LABEL[o.status]}</b></div>
      </section>
      <section className="stack-4">
        <SectionHeader title={`주문 상품 ${o.items.length}건`} />
        <ul className="m-0" style={{ padding: 0, listStyle: "none" }}>
          {o.items.map((it) => (
            <li key={it.id} className="row row--between" style={{ padding: "var(--space-3) 0", borderBottom: "var(--line-width) solid var(--line)" }}>
              <span className="stack-2" style={{ gap: "var(--space-1)" }}>
                <span className="body-sm-14 text-ink">{it.productName}</span>
                <span className="body-sm-13 text-sub">{it.option.isDefault ? "기본 구성" : it.optionName} · {it.quantity}개</span>
              </span>
              <span style={{ textAlign: "right" }}><b className="price-card-14 text-ink">{won(it.unitPrice * it.quantity)}</b><br /><span className="caption text-sub">{won(it.unitPrice)} × {it.quantity}</span></span>
            </li>
          ))}
        </ul>
      </section>
      <section className="stack-4">
        <SectionHeader title="결제 정보" />
        <OrderSummary rows={[{ label: "결제 수단", value: `${PAY_LABEL[o.paymentMethod]} (모의 결제)` }, { label: "배송비", value: "0원" }, { label: "할인", value: "0원" }]} total={{ label: "결제 금액", value: won(o.totalAmount) }} />
      </section>
      <section className="stack-2">
        <SectionHeader title="배송지" />
        <span className="body-sm-14 text-ink">{o.recipient} · {formatPhone(o.recipientPhone)}</span>
        <span className="body-sm-14">{o.address1}{o.address2 ? ` ${o.address2}` : ""}</span>
        {o.requestNote ? <span className="body-sm-13 text-sub">요청사항: {o.requestNote}</span> : null}
      </section>
      {o.status === "PAID" ? <CancelOrder orderNumber={o.orderNumber} /> : <p className="caption text-sub m-0">{o.status === "CANCELED" ? "취소된 주문입니다." : "배송 준비가 시작된 주문은 취소할 수 없습니다."}</p>}
      <Button href="/account/orders" variant="ghost" full>← 주문 내역으로</Button>
    </div>
  );
}
