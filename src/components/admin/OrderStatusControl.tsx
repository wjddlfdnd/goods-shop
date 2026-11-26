"use client";
// 주문 상태 변경(A-07): 다음 단계 1개만 선택지로. 변경 전 확인
import { useState, useTransition } from "react";
import { advanceOrderStatusAction, type AdminState } from "@/lib/actions/admin";
import { NEXT_STATUS, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { Button, Notice } from "../ui";
import { euro } from "@/lib/format";

export function OrderStatusControl({ id, status }: { id: string; status: OrderStatus }) {
  const next = NEXT_STATUS[status];
  const [state, setState] = useState<AdminState>();
  const [pending, start] = useTransition();
  return (
    <div className="stack-2">
      {state?.message ? <Notice live tone="danger">{state.message}</Notice> : state?.ok ? <Notice live>{state.ok}</Notice> : null}
      {status === "CANCELED" ? <p className="body-sm-14 text-sub m-0">주문 취소 상태의 주문은 변경할 수 없습니다.</p>
        : !next ? <p className="body-sm-14 text-sub m-0">배송이 완료된 주문입니다.</p>
        : (
          <Button variant="dark" disabled={pending} onClick={() => {
            if (confirm(`'${STATUS_LABEL[status]}'에서 '${euro(STATUS_LABEL[next])}' 바꿀까요? 되돌릴 수 없습니다.`)) start(async () => setState(await advanceOrderStatusAction(id, status, next)));
          }}>{pending ? "바꾸는 중…" : `${euro(STATUS_LABEL[next])} 변경`}</Button>
        )}
      {status === "PAID" ? <p className="caption text-sub m-0">관리자는 주문 취소를 만들 수 없습니다. 취소는 회원이 결제 완료 상태에서만 합니다.</p> : null}
    </div>
  );
}
