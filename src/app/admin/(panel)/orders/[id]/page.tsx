import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin-orders";
import { PAY_LABEL, STATUS_LABEL } from "@/lib/order-status";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { Button, OrderSummary } from "@/components/ui";
import { formatPhone, won } from "@/lib/format";

// 관리자 주문 상세(A-06·D-4) + 상태 변경(A-07)
export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return <Suspense fallback={<p className="caption">불러오는 중…</p>}><Detail params={params} /></Suspense>;
}

async function Detail({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  await connection();
  const o = await getAdminOrder((await params).id);
  if (!o) notFound();
  return (
    <div className="stack-8">
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <div>
          <h1 className="heading-sm-desktop m-0">주문 {o.orderNumber}</h1>
          <p className="body-sm-14 text-sub m-0">{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(o.createdAt)} · 현재 상태 <b className={o.status === "CANCELED" ? "text-danger" : "text-ink"}>{STATUS_LABEL[o.status]}</b></p>
        </div>
        <Button href="/admin/orders">← 주문 목록</Button>
      </div>
      <div className="split">
        <div className="stack-8">
          <section className="gs-panel stack-4" aria-label="주문 상품">
            <h2 className="heading-xs m-0">주문 상품 {o.items.length}건</h2>
            <div className="gs-table-wrap"><table className="gs-table">
              <caption className="sr-only">주문 상품</caption>
              <thead><tr>{["상품명", "옵션", "단가", "수량", "금액"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>{o.items.map((it) => (
                <tr key={it.id}><th scope="row">{it.productName}</th><td>{it.option.isDefault ? "기본 구성" : it.optionName}</td><td>{won(it.unitPrice)}</td><td>{it.quantity}</td><td>{won(it.unitPrice * it.quantity)}</td></tr>
              ))}</tbody>
            </table></div>
          </section>
          <section className="gs-panel stack-2" aria-label="주문자·배송지">
            <h2 className="heading-xs m-0">주문자·배송지</h2>
            <span className="body-sm-14">주문자: {o.ordererName} · {formatPhone(o.ordererPhone)} · {o.user.email}</span>
            <span className="body-sm-14">받는 사람: {o.recipient} · {formatPhone(o.recipientPhone)}</span>
            <span className="body-sm-14">주소: {o.address1}{o.address2 ? ` ${o.address2}` : ""}</span>
            {o.requestNote ? <span className="body-sm-14">요청사항: {o.requestNote}</span> : null}
          </section>
        </div>
        <aside className="split__aside stack-6">
          <section className="gs-panel stack-4" aria-label="결제 정보">
            <h2 className="heading-xs m-0">결제 정보</h2>
            <OrderSummary rows={[{ label: "결제 수단", value: `${PAY_LABEL[o.paymentMethod]} (모의 결제)` }, { label: "배송비", value: "0원" }]} total={{ label: "결제 금액", value: won(o.totalAmount) }} />
          </section>
          <section className="gs-panel stack-4" aria-label="상태 변경">
            <h2 className="heading-xs m-0">상태 변경</h2>
            <p className="caption text-sub m-0">결제 완료 → 배송 준비 → 배송 중 → 배송 완료, 한 번에 다음 단계로만</p>
            <OrderStatusControl key={o.id} id={o.id} status={o.status} />
          </section>
        </aside>
      </div>
    </div>
  );
}
