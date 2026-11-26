import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listAdminOrders, parseStatus } from "@/lib/admin-orders";
import { STATUS_LABEL } from "@/lib/order-status";
import { Button, Icon, Label } from "@/components/ui";
import { won } from "@/lib/format";

// 관리자 주문 목록(A-06, 2차): 주문 번호·상태·기간 검색, 최신순 20개씩. 조회만, 상태 변경은 상세에서(A-07)
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return <Suspense fallback={<p className="caption">불러오는 중…</p>}><Content searchParams={searchParams} /></Suspense>;
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const when = (d: Date) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" }).format(d);

async function Content({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const f = { orderNumber: str(sp.q), status: parseStatus(sp.status), from: str(sp.from), to: str(sp.to), page: Number(sp.page) || 1 };
  const list = await listAdminOrders(f);
  const qs = (page: number) => `/admin/orders?${new URLSearchParams(Object.entries({ q: f.orderNumber, status: f.status, from: f.from, to: f.to, page: String(page) }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div className="stack-8">
      <div>
        <h1 className="heading-sm-desktop m-0">주문 관리</h1>
        <p className="body-sm-14 text-sub m-0">주문 <b className="text-ink">{list.total}</b>건</p>
      </div>
      <form className="gs-panel row" style={{ flexWrap: "wrap", alignItems: "flex-end", gap: "var(--space-4)" }} aria-label="주문 검색" action="/admin/orders">
        <div className="gs-field" style={{ flex: 1, minWidth: "calc(var(--thumb-width) * 2)" }}>
          <label className="gs-field__label" htmlFor="o-q">주문 번호</label>
          <input id="o-q" name="q" className="gs-input" placeholder="예: 20261126-123456" defaultValue={f.orderNumber} />
        </div>
        <div className="gs-field">
          <label className="gs-field__label" htmlFor="o-status">주문 상태</label>
          <div className="gs-select-wrap"><select id="o-status" name="status" className="gs-select" defaultValue={f.status ?? ""}>
            <option value="">전체</option>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select><Icon name="chevron-right" /></div>
        </div>
        <div className="gs-field"><label className="gs-field__label" htmlFor="o-from">시작일</label><input id="o-from" name="from" type="date" className="gs-input" defaultValue={f.from} /></div>
        <div className="gs-field"><label className="gs-field__label" htmlFor="o-to">종료일</label><input id="o-to" name="to" type="date" className="gs-input" defaultValue={f.to} /></div>
        <Button type="submit" variant="dark">검색</Button>
      </form>
      {list.items.length ? (
        <div className="gs-table-wrap gs-panel">
          <table className="gs-table">
            <caption className="sr-only">주문 목록 {list.items.length}건</caption>
            <thead><tr>{["주문 번호", "주문일시", "주문자", "주문 상품", "결제 금액", "주문 상태"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {list.items.map((o) => (
                <tr key={o.id}>
                  <th scope="row"><Link href={`/admin/orders/${o.id}`} className="gs-link gs-link--strong">{o.orderNumber}</Link></th>
                  <td className="nowrap">{when(o.createdAt)}</td>
                  <td>{o.ordererName}</td>
                  <td>{o.firstName}{o.itemCount > 1 ? ` 외 ${o.itemCount - 1}건` : ""} · {o.quantity}개</td>
                  <td className="nowrap">{won(o.totalAmount)}</td>
                  <td>{o.status === "CANCELED" ? <Label kind="stopped">{STATUS_LABEL[o.status]}</Label> : STATUS_LABEL[o.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="gs-panel"><div className="gs-empty"><p className="gs-empty__title">조건에 맞는 주문이 없습니다</p><Button variant="dark" href="/admin/orders">전체 주문 보기</Button></div></div>}
      {list.pages > 1 ? (
        <nav className="row" style={{ justifyContent: "center" }} aria-label="페이지">
          {Array.from({ length: list.pages }, (_, i) => i + 1).map((n) => <Link key={n} href={qs(n)} aria-current={n === list.page ? "page" : undefined} className="gs-btn gs-btn--s gs-btn--ghost">{n}</Link>)}
        </nav>
      ) : null}
    </div>
  );
}
