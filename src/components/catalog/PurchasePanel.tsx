"use client";
// 상품 상세의 옵션·수량·구매 버튼(P-06·P-07·O-01·O-03).
// 품절 옵션은 선택 불가, 옵션 없는 상품은 기본 옵션 자동 선택(D-6), 수량은 1–재고(7.3).
import { useActionState, useState } from "react";
import { addToCartAction, buyNowAction, type PurchaseState } from "@/lib/actions/purchase";
import { Button, Notice, SelectField } from "../ui";
import { QuantityStepper } from "../QuantityStepper";
import { won } from "@/lib/format";
import type { ProductDetail } from "@/lib/catalog";

export function PurchasePanel({ product, back }: { product: ProductDetail; back: string }) {
  const stopped = product.status === "STOPPED";
  const soldOut = product.options.every((o) => o.stock === 0);
  const single = product.options.length === 1 && product.options[0].isDefault;
  const [optionId, setOptionId] = useState(single ? product.options[0].id : "");
  const [qty, setQty] = useState(1);
  const [cartState, cartAction, cartPending] = useActionState<PurchaseState, FormData>(addToCartAction, undefined);
  const [buyState, buyAction, buyPending] = useActionState<PurchaseState, FormData>(buyNowAction, undefined);
  const option = product.options.find((o) => o.id === optionId);
  const unit = product.price + (option?.extraPrice ?? 0);
  const blocked = stopped || soldOut;
  const error = cartState?.error ?? buyState?.error;
  const [clampedFor, setClampedFor] = useState<PurchaseState>(undefined);
  if (cartState !== clampedFor) {
    setClampedFor(cartState);
    if (cartState?.remaining && qty > cartState.remaining) setQty(cartState.remaining);
  }

  return (
    <form className="stack-6" noValidate>
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="back" value={back} />
      {!single ? (
        <SelectField id="opt" name="opt" label="옵션" placeholder="옵션을 선택하세요" hint="품절 옵션은 선택할 수 없습니다"
          value={optionId} onChange={(e) => { setOptionId(e.target.value); setQty(1); }} disabled={blocked}
          error={error === "옵션을 선택해 주세요." ? error : undefined}
          options={product.options.map((o) => ({
            value: o.id,
            label: `${o.name}${o.extraPrice ? ` (+${won(o.extraPrice)})` : ""} · ${o.stock > 0 ? `재고 ${o.stock}개` : "품절"}`,
            disabled: o.stock === 0,
          }))} />
      ) : null}
      {option && !blocked ? (
        <div className="gs-surface row row--between" style={{ alignItems: "center" }}>
          <div className="stack-2" style={{ gap: "var(--space-1)" }}>
            <span className="body-sm-13 text-ink">{single ? product.name : option.name}</span>
            <span className="price-card-15 text-ink">{won(unit)}</span>
            <span className="caption text-sub">재고 {option.stock}개 남음</span>
          </div>
          <QuantityStepper name="quantity" value={qty} onChange={setQty} max={option.stock} label={`${option.name} 수량`} />
        </div>
      ) : <input type="hidden" name="quantity" value={qty} />}
      {!blocked ? (
        <div className="row row--between">
          <span className="body-sm-14 text-sub">총 상품 금액</span>
          <b className="heading-xs">{won(option ? unit * qty : 0)}</b>
        </div>
      ) : null}
      {error && error !== "옵션을 선택해 주세요." ? <Notice live tone="danger">{error}{cartState?.remaining && !error.startsWith("장바구니에 이미") ? ` 수량을 남은 재고 ${cartState.remaining}개로 맞췄습니다.` : ""}</Notice> : null}
            {blocked ? <p className="body-sm-13 text-danger m-0" role="note">{stopped ? "판매가 중지된 상품이라" : "모든 옵션이 품절이라"} 담기·구매 버튼을 누를 수 없습니다</p> : null}
      <div className="purchase-bar">
        <Button type="submit" formAction={cartAction} variant="secondary" size="L" full disabled={blocked || cartPending || buyPending}>장바구니 담기</Button>
        <Button type="submit" formAction={buyAction} variant="primary" size="L" full disabled={blocked || cartPending || buyPending}>바로 구매</Button>
      </div>
    </form>
  );
}
