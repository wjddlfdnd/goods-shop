"use client";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/lib/actions/admin";
import { Button } from "../ui";

// 상품 삭제(A-02): 주문 이력이 있으면 '삭제 불가'(판매 중지만). 삭제 전 확인
export function DeleteProductButton({ id, name, hasOrders }: { id: string; name: string; hasOrders: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  if (hasOrders) return <Button size="S" variant="ghost" disabled aria-label={`${name}, 주문 이력 있음`}>삭제 불가</Button>;
  return (
    <>
      <Button size="S" variant="ghost" disabled={pending} aria-label={`${name} 삭제`}
        onClick={() => { if (confirm(`'${name}'을(를) 삭제할까요? 되돌릴 수 없습니다.`)) start(async () => { const r = await deleteProductAction(id); if (r?.message) setErr(r.message); }); }}>삭제</Button>
      {err ? <span className="caption text-danger" role="alert">{err}</span> : null}
    </>
  );
}
