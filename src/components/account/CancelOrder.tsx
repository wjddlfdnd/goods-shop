"use client";
// 주문 취소 버튼 + 확인(O-07). 결제 완료 상태에서만 보인다. 서버가 상태를 다시 확인한다(PRD 4.2 시나리오 4)
import { useState, useTransition } from "react";
import { cancelOrderAction, type CancelState } from "@/lib/actions/my-orders";
import { Button, Notice } from "../ui";

export function CancelOrder({ orderNumber }: { orderNumber: string }) {
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<CancelState>();
  const [pending, start] = useTransition();
  return (
    <div className="stack-4">
      {state?.error ? <Notice live tone="danger">{state.error}</Notice> : null}
      {asking ? (
        <div className="gs-dialog stack-4" role="alertdialog" aria-labelledby="cancel-title" style={{ maxWidth: "none" }}>
          <h2 id="cancel-title" className="gs-dialog__title">주문을 취소할까요?</h2>
          <p className="gs-dialog__text">취소하면 되돌릴 수 없습니다. 주문은 내역에 &lsquo;주문 취소&rsquo;로 남습니다.</p>
          <div className="gs-dialog__actions">
            <Button onClick={() => setAsking(false)} disabled={pending}>닫기</Button>
            <Button variant="danger" disabled={pending} onClick={() => start(async () => { setState(await cancelOrderAction(orderNumber)); setAsking(false); })}>{pending ? "취소 중…" : "주문 취소"}</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" full onClick={() => setAsking(true)}>주문 취소</Button>
      )}
    </div>
  );
}
