"use client";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/lib/actions/auth";
import { Button, TextField } from "../ui";

export function LoginForm({ next, intent }: { next?: string; intent?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack-6" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="intent" value={intent ?? ""} />
      <TextField id="login-email" name="email" label="이메일" type="email" autoComplete="email" placeholder="example@email.com"
        defaultValue={state?.values?.email} error={e.email?.trim() ? e.email : undefined} aria-invalid={e.email ? true : undefined} required />
      <TextField id="login-password" name="password" label="비밀번호" type="password" autoComplete="current-password" placeholder="비밀번호" error={e.password} required />
      <Button type="submit" variant="primary" size="L" full disabled={pending}>{pending ? "로그인 중…" : "로그인"}</Button>
      <p className="body-sm-14 text-sub m-0" style={{ textAlign: "center" }}>
        아직 회원이 아니신가요? <Link className="gs-link gs-link--strong" href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>회원가입 →</Link>
      </p>
    </form>
  );
}
