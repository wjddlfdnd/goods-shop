"use client";
// 주문서(O-04)와 모의 결제(O-05). 필수값이 모두 있어야 결제하기 활성(PRD 4.2), 처리 중에는 버튼을 막아 중복 주문을 막는다(6장).
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { placeOrderAction, type OrderState } from "@/lib/actions/order";
import type { CheckoutLine } from "@/lib/order";
import { Button, Checkbox, Notice, OrderSummary, Radio, SectionHeader, TextField } from "../ui";
import { formatPhone, won } from "@/lib/format";

type Prefill = { orderer: { name: string; phone: string }; address: { recipient: string; phone: string; address1: string; address2: string | null } | null };

export function CheckoutForm({ lines, prefill, idempotencyKey, source, back }: {
  lines: CheckoutLine[]; prefill: Prefill; idempotencyKey: string; source: { items?: string; buy?: string }; back: { href: string; label: string };
}) {
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrderAction, undefined);
  const a = prefill.address;
  const [v, setV] = useState({
    ordererName: prefill.orderer.name, ordererPhone: formatPhone(prefill.orderer.phone),
    recipient: a?.recipient ?? "", recipientPhone: a ? formatPhone(a.phone) : "", address1: a?.address1 ?? "",
  });
  // React 19는 액션이 끝나면 비제어 입력을 초기화하므로, 실패해도 입력값이 남도록 모두 제어 입력으로 둔다
  const [opt, setOpt] = useState({ address2: a?.address2 ?? "", requestNote: "", paymentMethod: "CARD", saveAsDefault: true });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const set = (k: keyof typeof v, phone = false) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: phone ? formatPhone(e.target.value) : e.target.value });
  const blur = (k: string) => () => setTouched({ ...touched, [k]: true });

  const REQUIRED: Record<keyof typeof v, string> = { ordererName: "주문자 이름을 입력해 주세요.", ordererPhone: "주문자 연락처를 입력해 주세요.", recipient: "받는 사람을 입력해 주세요.", recipientPhone: "연락처를 입력해 주세요.", address1: "주소를 입력해 주세요." };
  const missing = (Object.keys(v) as (keyof typeof v)[]).filter((k) => !v[k].trim());
  const reqError = (k: keyof typeof v) => state?.errors?.[k] ?? (touched[k] && !v[k].trim() ? REQUIRED[k] : undefined);
  const stockMap = new Map(state?.stock?.map((s) => [s.optionId, s.remaining]));
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const blocked = !!state?.stock?.length || !!state?.unavailable;

  const item = (l: CheckoutLine) => (
    <li key={l.optionId} className="line-item line-item--plain">
      <div className="line-item__thumb" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {l.imageUrl ? <img src={l.imageUrl} alt="" /> : null}
      </div>
      <div className="stack-2" style={{ gap: "var(--space-1)" }}>
        <span className="body-sm-14 bold text-ink">{l.productName}</span>
        <span className="body-sm-13 text-sub">{l.isDefaultOption ? "기본 구성" : l.optionName} · {l.quantity}개</span>
        <span className="price-card-14 text-ink">{won(l.unitPrice * l.quantity)} <span className="caption text-sub">{won(l.unitPrice)} × {l.quantity}</span></span>
        {stockMap.has(l.optionId) ? <span className="body-sm-13 text-danger">재고 부족 · 남은 수량 {stockMap.get(l.optionId)}개</span> : null}
      </div>
    </li>
  );

  return (
    // form action 대신 onSubmit: 실패해도 React가 폼을 초기화하지 않아 입력값(라디오 포함)이 그대로 남는다
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }} className="split" noValidate>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {source.items ? <input type="hidden" name="items" value={source.items} /> : null}
      {source.buy ? <input type="hidden" name="buy" value={source.buy} /> : null}
      <div className="stack-8">
        {state?.serverError ? (
          <Notice live tone="danger"><strong>결제를 처리하지 못했습니다.</strong><br />일시적인 서버 오류로 주문이 만들어지지 않았고, 재고와 장바구니도 바뀌지 않았습니다. 입력한 정보는 그대로 두었으니 다시 시도해 주세요.</Notice>
        ) : state?.stock?.length ? (
          <Notice live tone="danger"><strong>재고가 부족해 주문하지 못했습니다.</strong><br />주문·결제는 진행되지 않았습니다. {back.label === "장바구니로 돌아가기" ? "장바구니에서 수량을 바꾸거나 상품을 삭제한 뒤" : "수량을 바꾼 뒤"} 다시 주문해 주세요.</Notice>
        ) : state?.message ? <Notice live tone="danger">{state.message}</Notice> : null}
        {state?.errors && Object.keys(state.errors).length ? (
          <Notice live tone="danger">필수 항목 {Object.keys(state.errors).length}개를 확인해 주세요.</Notice>
        ) : null}

        <section className="stack-4">
          <SectionHeader title={`주문 상품 ${lines.length}건`} />
          <details className="only-mobile">
            <summary className="body-sm-13 text-sub">{lines[0].productName} {lines.length > 1 ? `외 ${lines.length - 1}건` : ""} · 펼치기</summary>
            <ul className="m-0" style={{ padding: 0, listStyle: "none" }}>{lines.map(item)}</ul>
          </details>
          <ul className="m-0 only-desktop" style={{ padding: 0, listStyle: "none" }}>{lines.map(item)}</ul>
          {state?.stock?.length ? <ul className="m-0 only-mobile" style={{ padding: 0, listStyle: "none" }}>{lines.filter((l) => stockMap.has(l.optionId)).map(item)}</ul> : null}
        </section>

        <section className="stack-4">
          <SectionHeader title="주문자 정보" />
          <Notice>회원 정보로 미리 채웠습니다. 필요하면 고쳐 주세요.</Notice>
          <div className="field-row field-row--2">
            <TextField id="buyer-name" name="ordererName" label="이름" autoComplete="name" value={v.ordererName} onChange={set("ordererName")} onBlur={blur("ordererName")} error={reqError("ordererName")} required />
            <TextField id="buyer-phone" name="ordererPhone" label="연락처" type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000" value={v.ordererPhone} onChange={set("ordererPhone", true)} onBlur={blur("ordererPhone")} error={reqError("ordererPhone")} maxLength={13} required />
          </div>
        </section>

        <section className="stack-4">
          <SectionHeader title="배송지" />
          <p className="caption text-sub m-0">(선택) 표시가 없는 항목은 필수입니다.</p>
          <div className="field-row field-row--2">
            <TextField id="ship-name" name="recipient" label="받는 사람" autoComplete="shipping name" value={v.recipient} onChange={set("recipient")} onBlur={blur("recipient")} error={reqError("recipient")} required />
            <TextField id="ship-phone" name="recipientPhone" label="연락처" type="tel" inputMode="numeric" autoComplete="shipping tel" placeholder="010-0000-0000" value={v.recipientPhone} onChange={set("recipientPhone", true)} onBlur={blur("recipientPhone")} error={reqError("recipientPhone")} maxLength={13} required />
          </div>
          <TextField id="ship-addr" name="address1" label="주소" autoComplete="shipping address-line1" placeholder="예: 서울시 마포구 굿즈로 12" value={v.address1} onChange={set("address1")} onBlur={blur("address1")} error={reqError("address1")} required />
          <TextField id="ship-addr2" name="address2" label="상세 주소 (선택)" autoComplete="shipping address-line2" value={opt.address2} onChange={(e) => setOpt({ ...opt, address2: e.target.value })} />
          <TextField id="ship-memo" name="requestNote" label="배송 요청사항 (선택)" placeholder="예: 문 앞에 놓아 주세요" value={opt.requestNote} onChange={(e) => setOpt({ ...opt, requestNote: e.target.value })} />
          {!a ? (
            <div className="stack-2">
              <Checkbox name="saveAsDefault" label="기본 배송지로 저장" checked={opt.saveAsDefault} onChange={(e) => setOpt({ ...opt, saveAsDefault: e.target.checked })} />
              <p className="caption text-sub m-0">다음 주문 때 배송지가 자동으로 채워집니다.</p>
            </div>
          ) : <p className="caption text-sub m-0">기본 배송지를 미리 채웠습니다.</p>}
        </section>

        <section className="stack-4">
          <SectionHeader title="결제 수단" />
          <div role="radiogroup" aria-label="결제 수단" className="field-row field-row--2">
            <Radio name="paymentMethod" value="CARD" label="카드" checked={opt.paymentMethod === "CARD"} onChange={() => setOpt({ ...opt, paymentMethod: "CARD" })} />
            <Radio name="paymentMethod" value="TRANSFER" label="계좌이체" checked={opt.paymentMethod === "TRANSFER"} onChange={() => setOpt({ ...opt, paymentMethod: "TRANSFER" })} />
            <Radio name="paymentMethod" value="EASY_PAY" label="간편결제" checked={opt.paymentMethod === "EASY_PAY"} onChange={() => setOpt({ ...opt, paymentMethod: "EASY_PAY" })} />
          </div>
          <Notice>모의 결제입니다. 결제 정보 입력 없이 결제 완료로 처리됩니다.</Notice>
        </section>
      </div>

      <aside className="split__aside panel-card stack-4" aria-label="주문 요약">
        <h2 className="heading-xs m-0">주문 요약</h2>
        <p className="body-sm-14 text-sub m-0">주문 상품 {lines.length}건 · 총 {count}개</p>
        <OrderSummary rows={[{ label: "상품 금액", value: won(total) }, { label: "배송비", value: "0원" }, { label: "할인", value: "0원" }]} total={{ label: "예상 결제 금액", value: won(total) }} />
        {blocked ? (
          <>
            <p className="body-sm-13 text-danger m-0">{state?.unavailable ? "판매가 중지된 상품이 있어 결제할 수 없습니다." : "재고가 부족한 상품이 있어 결제할 수 없습니다."}</p>
            <Button href={back.href} variant="dark" size="L" full>{back.label}</Button>
          </>
        ) : (
          <>
            {missing.length ? <p className="body-sm-13 text-danger m-0">필수 항목 {missing.length}개를 입력하면 결제할 수 있습니다.</p> : null}
            <Button type="submit" variant="primary" size="L" full disabled={pending || missing.length > 0}>
              {pending ? "결제 처리 중…" : state?.serverError ? "결제 다시 시도" : `${won(total)} 결제하기`}
            </Button>
          </>
        )}
        <Link href={back.href} className="gs-link body-sm-14"><span>← {back.label}</span></Link>
      </aside>
    </form>
  );
}
