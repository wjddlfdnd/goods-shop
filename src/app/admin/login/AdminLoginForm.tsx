"use client";
import { startTransition, useActionState, useState } from "react";
import { adminLoginAction, type AdminState } from "@/lib/actions/admin";
import { Button, Notice, TextField } from "@/components/ui";

// 실패해도 이메일은 남긴다(PRD 4.2 로그인 실패: 비밀번호 제외 입력값 유지)
export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(adminLoginAction, undefined);
  const [email, setEmail] = useState("");
  return (
    <form className="stack-4" noValidate onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); e.currentTarget.querySelector<HTMLInputElement>("#admin-password")!.value = ""; startTransition(() => action(fd)); }}>
      {state?.message ? <Notice live tone="danger">{state.message}</Notice> : null}
      <TextField id="admin-email" name="email" label="이메일" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <TextField id="admin-password" name="password" label="비밀번호" type="password" autoComplete="current-password" required />
      <Button type="submit" variant="dark" size="L" full disabled={pending}>{pending ? "로그인 중…" : "관리자 로그인"}</Button>
    </form>
  );
}
