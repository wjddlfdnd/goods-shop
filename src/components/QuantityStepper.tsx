"use client";
// 수량 조절(PRD 7.3): 최소 1, 최대 재고. 폼 전송용 hidden input(name)을 함께 그린다.
import { useState } from "react";
import { Icon, cx } from "./ui";

export function QuantityStepper({ name, defaultValue = 1, value: controlled, onChange, min = 1, max = Infinity, disabled, label = "수량", className }: {
  name?: string; defaultValue?: number; value?: number; onChange?: (v: number) => void; min?: number; max?: number; disabled?: boolean; label?: string; className?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const set = (v: number) => {
    const next = Math.max(min, Math.min(max, v));
    setInner(next);
    onChange?.(next);
  };
  return (
    <div className={cx("gs-step", className)} role="group" aria-label={label}>
      <button type="button" className="gs-step__btn" aria-label="수량 줄이기" disabled={disabled || value <= min} onClick={() => set(value - 1)}><Icon name="minus" size={18} /></button>
      <span className="gs-step__num" aria-live="polite">{value}</span>
      <button type="button" className="gs-step__btn" aria-label="수량 늘리기" disabled={disabled || value >= max} onClick={() => set(value + 1)}><Icon name="plus" size={18} /></button>
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
