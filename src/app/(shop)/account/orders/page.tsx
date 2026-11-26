import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { EmptyState, Icon, Label } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/order";
import { STATUS_LABEL } from "@/lib/order-status";
import { won } from "@/lib/format";

// 주문 내역(U-05, 2차): 본인 주문만 주문일 내림차순, 취소 주문도 남는다. 0건이면 빈 상태 + 홈 이동(7.10)
export default function OrdersPage() {
  return (
    <>
      <MobileSubHeader back="/account" title="주문 내역" />
      <main className="page container">
        <div className="form-card" style={{ maxWidth: "calc(var(--grid-mobile-width) * 1.6)" }}>
          <h1 className="page-title heading-lg-mobile sr-only-mobile">주문 내역</h1>
          <Suspense fallback={<p className="caption">불러오는 중…</p>}><List /></Suspense>
        </div>
      </main>
    </>
  );
}

const dateText = (d: Date) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

async function List() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/orders");
  const orders = await listMyOrders(user.id);
  if (!orders.length) return <div className="mt-6"><EmptyState title="주문 내역이 없습니다" text="마음에 드는 굿즈를 골라 첫 주문을 해 보세요." actionText="홈으로 가기" href="/" /></div>;
  return (
    <ul className="m-0 mt-6" style={{ padding: 0, listStyle: "none" }}>
      {orders.map((o) => (
        <li key={o.orderNumber}>
          <Link href={`/account/orders/${o.orderNumber}`} className="line-item line-item--plain" style={{ textDecoration: "none", gridTemplateColumns: "var(--thumb-width) minmax(0, 1fr) auto" }}>
            <div className="line-item__thumb" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {o.imageUrl ? <img src={o.imageUrl} alt="" /> : null}
            </div>
            <div className="stack-2" style={{ gap: "var(--space-1)" }}>
              <span className="caption text-sub">{dateText(o.createdAt)} · {o.orderNumber}</span>
              <span className="body-sm-14 bold text-ink">{o.firstName}{o.itemCount > 1 ? ` 외 ${o.itemCount - 1}건` : ""}</span>
              <span className="body-sm-13 text-sub">총 {o.quantity}개 · <b className="text-ink">{won(o.totalAmount)}</b></span>
              <span>{o.status === "CANCELED" ? <Label kind="stopped">{STATUS_LABEL[o.status]}</Label> : <span className="gs-pill">{STATUS_LABEL[o.status]}</span>}</span>
            </div>
            <Icon name="chevron-right" size={20} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
