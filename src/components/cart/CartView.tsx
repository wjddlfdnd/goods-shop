"use client";
// 장바구니 화면(O-02): 전체 선택·선택 삭제·수량 변경·구매 불가 사유·예상 결제 금액.
// 선택 항목 중 구매 불가 항목이 하나라도 있으면 주문하기 비활성(PRD 7.3).
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeItemsAction, setQuantityAction, type CartActionState } from "@/lib/actions/cart";
import type { CartLine } from "@/lib/cart";
import { Button, Checkbox, Notice, OrderSummary } from "../ui";
import { QuantityStepper } from "../QuantityStepper";
import { won } from "@/lib/format";

export function CartView({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(lines.map((l) => l.id)));
  const [msg, setMsg] = useState<CartActionState>(undefined);
  const [pending, start] = useTransition();
  const [qtys, setOptimisticQty] = useOptimistic(new Map(lines.map((l) => [l.id, l.quantity])), (m, [id, q]: [string, number]) => new Map(m).set(id, q));

  const ids = lines.map((l) => l.id);
  const sel = lines.filter((l) => selected.has(l.id));
  const blocked = sel.filter((l) => l.problem);
  const allOn = lines.length > 0 && sel.length === lines.length;
  const total = sel.reduce((s, l) => s + l.unitPrice * (qtys.get(l.id) ?? l.quantity), 0);
  const count = sel.reduce((s, l) => s + (qtys.get(l.id) ?? l.quantity), 0);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const changeQty = (l: CartLine, q: number) => start(async () => {
    setOptimisticQty([l.id, q]);
    setMsg(await setQuantityAction(l.id, q));
  });
  const removeSelected = () => start(async () => {
    if (!sel.length) return;
    setMsg(await removeItemsAction(sel.map((l) => l.id)));
    setSelected(new Set());
  });
  const order = () => router.push(`/checkout?items=${sel.map((l) => l.id).join(",")}`);

  return (
    <div className="split">
      <section aria-label="장바구니 상품" className="stack-4">
        {blocked.length ? (
          <Notice live tone="danger"><strong>구매할 수 없는 상품 {blocked.length}개가 선택되어 있습니다.</strong><br />선택 해제·삭제하거나 수량을 줄이면 주문할 수 있습니다.</Notice>
        ) : null}
        <div className="row row--between" style={{ borderBottom: "var(--line-width) solid var(--line)" }}>
          <Checkbox label={`전체 선택 (${sel.length}/${lines.length})`} checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(ids))} />
          <Button variant="ghost" size="S" onClick={removeSelected} disabled={!sel.length || pending}>선택 삭제</Button>
        </div>
        <ul className="m-0" style={{ padding: 0, listStyle: "none" }}>
          {lines.map((l) => {
            const q = qtys.get(l.id) ?? l.quantity;
            return (
              <li key={l.id} className="line-item">
                <Checkbox label={<span className="sr-only">{l.productName} 선택</span>} checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                <Link href={`/products/${l.productId}`} className="line-item__thumb" aria-hidden="true" tabIndex={-1}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.imageUrl ? <img src={l.imageUrl} alt="" /> : null}
                </Link>
                <div className="stack-2">
                  <Link href={`/products/${l.productId}`} className="body-sm-14 bold text-ink" style={{ textDecoration: "none" }}>{l.productName}</Link>
                  <span className="caption text-sub">옵션: {l.isDefaultOption ? "기본 구성" : l.optionName}</span>
                  <div className="row row--between" style={{ flexWrap: "wrap" }}>
                    <QuantityStepper value={q} onChange={(v) => changeQty(l, v)} max={l.problem?.code === "OUT_OF_STOCK" ? Math.max(q, 1) : Math.max(l.stock, 1)} disabled={pending || l.problem?.code === "STOPPED" || l.problem?.code === "SOLD_OUT"} label={`${l.productName} 수량`} />
                    <div style={{ textAlign: "right" }}>
                      <b className="price-card-15 text-ink">{won(l.unitPrice * q)}</b><br />
                      <span className="caption text-sub">개당 {won(l.unitPrice)}</span>
                    </div>
                  </div>
                  {l.problem ? <p className="body-sm-13 text-danger m-0">{l.problem.message}</p> : null}
                  {msg?.itemId === l.id ? <p className={`body-sm-13 m-0 ${msg.error ? "text-danger" : "text-sub"}`} role="status">{msg.error ?? msg.info}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="caption text-sub m-0">품절·판매 중지·재고 부족 상품은 상품 아래에 사유가 표시되며, 선택하면 주문할 수 없습니다.</p>
        <Link href="/products" className="gs-link body-sm-14"><span>← 쇼핑 계속하기</span></Link>
      </section>
      <aside className="split__aside panel-card stack-4" aria-label="주문 요약">
        <h2 className="heading-xs m-0">주문 요약</h2>
        <p className="body-sm-14 text-sub m-0">선택 상품 {sel.length}건 · 총 {count}개</p>
        <OrderSummary rows={[{ label: "상품 금액", value: won(total) }, { label: "배송비", value: "0원" }, { label: "할인", value: "0원" }]} total={{ label: "예상 결제 금액", value: won(total) }} />
        {blocked.length ? <p className="body-sm-13 text-danger m-0">구매할 수 없는 상품이 선택되어 있어 주문할 수 없습니다</p> : !sel.length ? <p className="body-sm-13 text-sub m-0">주문할 상품을 선택해 주세요</p> : null}
        <Button variant="primary" size="L" full onClick={order} disabled={!sel.length || blocked.length > 0 || pending}>선택 상품 주문하기</Button>
        <p className="caption text-sub m-0">모든 주문은 배송비 0원입니다.</p>
      </aside>
    </div>
  );
}
