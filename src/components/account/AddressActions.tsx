"use client";
import { useState, useTransition } from "react";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/actions/account";
import { Button } from "../ui";

export function AddressActions({ id, label, isDefault }: { id: string; label: string; isDefault: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  return (
    <span className="row" style={{ flexWrap: "wrap" }}>
      {!isDefault ? <Button size="S" disabled={pending} onClick={() => start(async () => setErr((await setDefaultAddressAction(id))?.message))} aria-label={`${label} 기본으로 지정`}>기본으로 지정</Button> : null}
      <Button size="S" href={`/account/addresses?edit=${id}`} aria-label={`${label} 수정`}>수정</Button>
      <Button size="S" variant="ghost" disabled={pending} aria-label={`${label} 삭제`}
        onClick={() => { if (confirm(isDefault ? "기본 배송지를 삭제할까요? 다음 주문서에는 미리 채워지지 않습니다." : "이 배송지를 삭제할까요?")) start(async () => setErr((await deleteAddressAction(id))?.message)); }}>삭제</Button>
      {err ? <span className="caption text-danger" role="alert">{err}</span> : null}
    </span>
  );
}
