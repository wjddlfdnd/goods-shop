"use client";
// 연락처 입력(PRD v1.4): 입력하는 동안 하이픈을 자동으로 넣어 보여 주고, 서버는 숫자만 저장한다.
import { useState } from "react";
import { TextField } from "../ui";
import { formatPhone } from "@/lib/format";

export function PhoneField({ id, name, label = "연락처", defaultValue = "", error, hint = "숫자만 입력하면 하이픈이 자동으로 들어갑니다" }: {
  id: string; name: string; label?: string; defaultValue?: string; error?: string; hint?: string;
}) {
  const [v, setV] = useState(formatPhone(defaultValue));
  return (
    <TextField id={id} name={name} label={label} type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000"
      value={v} onChange={(e) => setV(formatPhone(e.target.value))} maxLength={13} error={error} hint={hint} required />
  );
}
