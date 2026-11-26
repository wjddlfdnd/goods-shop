import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { MobileHomeHeader } from "@/components/layout/SiteHeader";
import { OrderSteps } from "@/components/cart/OrderSteps";
import { Button, Icon, OrderSummary, SectionHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { getOrder } from "@/lib/order";
import { formatPhone, won } from "@/lib/format";

const PAY = { CARD: "카드", TRANSFER: "계좌이체", EASY_PAY: "간편결제" } as const;

// 주문 완료(O-06): 주문 번호·주문 상품·결제 금액·배송지·결제 완료. 새로고침해도 주문은 다시 만들어지지 않는다(조회만)
export default function CompletePage({ params }: PageProps<"/orders/[orderNumber]/complete">) {
  return (
    <>
      <MobileHomeHeader />
      <main className="page container">
        <div className="row" style={{ justifyContent: "flex-end" }}><OrderSteps current={3} /></div>
        <Suspense fallback={<p className="caption">불러오는 중…</p>}><Complete params={params} /></Suspense>
      </main>
    </>
  );
}

async function Complete({ params }: { params: PageProps<"/orders/[orderNumber]/complete">["params"] }) {
  const { orderNumber } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/orders/${orderNumber}/complete`);
  const order = await getOrder(user.id, orderNumber);
  if (!order) notFound(); // 남의 주문·없는 주문
  return (
    <div className="form-card stack-8" style={{ maxWidth: "calc(var(--grid-mobile-width) * 1.6)" }}>
      <section className="stack-4" style={{ textAlign: "center", alignItems: "center" }}>
        <span className="text-ink"><Icon name="check" size={48} /></span>
        <h1 className="heading-lg-mobile m-0">주문이 완료되었습니다</h1>
        <p className="body-sm-14 m-0 row" style={{ justifyContent: "center" }}><Icon name="check" size={16} /><span>결제 완료</span></p>
      </section>
      <div className="gs-surface row row--between"><span className="body-sm-14 text-sub">주문 번호</span><b className="text-ink">{order.orderNumber}</b></div>
      <section className="stack-4">
        <SectionHeader title={`주문 상품 ${order.items.length}건`} />
        <ul className="m-0" style={{ padding: 0, listStyle: "none" }}>
          {order.items.map((it) => (
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
        <OrderSummary rows={[{ label: "결제 수단", value: `${PAY[order.paymentMethod]} (모의 결제)` }, { label: "배송비", value: "0원" }, { label: "할인", value: "0원" }]} total={{ label: "결제 금액", value: won(order.totalAmount) }} />
      </section>
      <section className="stack-2">
        <SectionHeader title="배송지" />
        <span className="body-sm-14 text-ink">{order.recipient} · {formatPhone(order.recipientPhone)}</span>
        <span className="body-sm-14">{order.address1}{order.address2 ? ` ${order.address2}` : ""}</span>
        {order.requestNote ? <span className="body-sm-13 text-sub">요청사항: {order.requestNote}</span> : null}
      </section>
      <Button variant="dark" href="/" full>쇼핑 계속하기</Button>
      <Button variant="ghost" href={`/account/orders/${order.orderNumber}`} full>주문 상세 보기</Button>
    </div>
  );
}
