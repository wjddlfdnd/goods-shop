"use client";
import { startTransition, useActionState, useState } from "react";
import { updateProfileAction, type AccountState } from "@/lib/actions/account";
import { Button, Notice, TextField } from "../ui";
import { formatPhone } from "@/lib/format";

// 회원 정보 수정(U-03): 이름·연락처. 이메일은 바꿀 수 없다
export function ProfileForm({ email, name, phone }: { email: string; name: string; phone: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, undefined);
  const [v, setV] = useState({ name, phone: formatPhone(phone) });
  const e = state?.errors ?? {};
  return (
    <form className="stack-6" noValidate onSubmit={(ev) => { ev.preventDefault(); const fd = new FormData(ev.currentTarget); startTransition(() => action(fd)); }}>
      {state?.ok ? <Notice live>{state.ok}</Notice> : null}
      <TextField id="pf-email" label="이메일" value={email} readOnly disabled hint="이메일은 바꿀 수 없습니다." />
      <TextField id="pf-name" name="name" label="이름" autoComplete="name" maxLength={50} value={v.name} onChange={(x) => setV({ ...v, name: x.target.value })} error={e.name} required />
      <TextField id="pf-phone" name="phone" label="연락처" type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000" maxLength={13}
        value={v.phone} onChange={(x) => setV({ ...v, phone: formatPhone(x.target.value) })} error={e.phone} hint="숫자만 입력하면 하이픈이 자동으로 들어갑니다" required />
      <Button type="submit" variant="dark" size="L" full disabled={pending}>{pending ? "저장 중…" : "저장"}</Button>
      <Button href="/account/addresses" variant="ghost" full>기본 배송지는 배송지 관리에서 바꿀 수 있습니다 →</Button>
    </form>
  );
}
