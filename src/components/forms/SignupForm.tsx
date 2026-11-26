"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type FormState } from "@/lib/actions/auth";
import { Button, Notice, TextField } from "../ui";
import { PhoneField } from "./PhoneField";

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signupAction, undefined);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  return (
    // key: 오류로 돌아오면 입력값(defaultValue)을 다시 채운다
    <form key={JSON.stringify(v)} action={action} className="stack-6" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <p className="caption text-sub m-0">모든 항목 필수</p>
      <div className="stack-2">
        <TextField id="signup-email" name="email" label="이메일" type="email" autoComplete="email" placeholder="example@email.com" defaultValue={v.email} error={e.email} required />
        {e.email === "이미 가입된 이메일입니다." ? <Link className="gs-link gs-link--strong body-sm-14" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>이 이메일로 로그인하기 →</Link> : null}
      </div>
      <TextField id="signup-password" name="password" label="비밀번호" type="password" autoComplete="new-password" placeholder="8자 이상" hint="8자 이상" error={e.password} required />
      <TextField id="signup-password2" name="passwordConfirm" label="비밀번호 확인" type="password" autoComplete="new-password" placeholder="비밀번호 다시 입력" error={e.passwordConfirm} required />
      <TextField id="signup-name" name="name" label="이름" autoComplete="name" placeholder="이름" defaultValue={v.name} error={e.name} required />
      <PhoneField id="signup-phone" name="phone" defaultValue={v.phone} error={e.phone} />
      <Notice>배송지는 첫 주문서에서 입력하고 기본 배송지로 저장할 수 있습니다.</Notice>
      <Button type="submit" variant="primary" size="L" full disabled={pending}>{pending ? "가입 중…" : "가입하기"}</Button>
      <p className="body-sm-14 text-sub m-0" style={{ textAlign: "center" }}>
        이미 회원이신가요? <Link className="gs-link gs-link--strong" href="/login">로그인 →</Link>
      </p>
    </form>
  );
}
