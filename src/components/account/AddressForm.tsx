"use client";
import { startTransition, useActionState, useState } from "react";
import { saveAddressAction, type AccountState } from "@/lib/actions/account";
import { Button, Checkbox, Notice, TextField } from "../ui";
import { formatPhone } from "@/lib/format";

type A = { id?: string; recipient: string; phone: string; address1: string; address2: string | null; isDefault: boolean };

// 배송지 등록·수정(U-04). 주소 검색 없이 직접 입력(1차와 같음, v1.2)
export function AddressForm({ address, first }: { address: A; first: boolean }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveAddressAction, undefined);
  const [v, setV] = useState({ ...address, phone: formatPhone(address.phone), address2: address.address2 ?? "", isDefault: address.isDefault || first });
  const e = state?.errors ?? {};
  return (
    <form className="stack-4" noValidate onSubmit={(ev) => { ev.preventDefault(); const fd = new FormData(ev.currentTarget); startTransition(() => action(fd)); }}>
      {address.id ? <input type="hidden" name="id" value={address.id} /> : null}
      {state?.message ? <Notice live tone="danger">{state.message}</Notice> : null}
      <div className="field-row field-row--2">
        <TextField id="ad-name" name="recipient" label="받는 사람" maxLength={50} value={v.recipient} onChange={(x) => setV({ ...v, recipient: x.target.value })} error={e.recipient} required />
        <TextField id="ad-phone" name="phone" label="연락처" type="tel" inputMode="numeric" placeholder="010-0000-0000" maxLength={13} value={v.phone} onChange={(x) => setV({ ...v, phone: formatPhone(x.target.value) })} error={e.phone} required />
      </div>
      <TextField id="ad-addr" name="address1" label="주소" maxLength={255} placeholder="예: 서울시 마포구 굿즈로 12" value={v.address1} onChange={(x) => setV({ ...v, address1: x.target.value })} error={e.address1} required />
      <TextField id="ad-addr2" name="address2" label="상세 주소 (선택)" maxLength={255} value={v.address2} onChange={(x) => setV({ ...v, address2: x.target.value })} error={e.address2} />
      <Checkbox name="isDefault" label={first ? "기본 배송지(첫 배송지는 기본으로 저장됩니다)" : "기본 배송지로 지정"} checked={v.isDefault} disabled={first}
        onChange={(x) => setV({ ...v, isDefault: x.target.checked })} />
      {first ? <input type="hidden" name="isDefault" value="on" /> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button href="/account/addresses">취소</Button>
        <Button type="submit" variant="dark" disabled={pending}>{pending ? "저장 중…" : "저장"}</Button>
      </div>
    </form>
  );
}
