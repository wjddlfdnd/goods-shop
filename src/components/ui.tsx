// 팬덤픽 디자인 시스템 v2.3 컴포넌트(TSX). 원본: design/hifi/ds/goodsshop/bundle.js
// 스타일은 src/styles/components.css(gs-*)만 쓴다. 서버 컴포넌트에서 바로 쓸 수 있게 훅을 쓰지 않는다.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Icon: 24 viewBox, 선 아이콘 ---------- */
const PATHS: Record<string, ReactNode> = {
  search: (<><circle cx={11} cy={11} r={7} /><path d="M20 20l-3.5-3.5" /></>),
  user: (<><circle cx={12} cy={8} r={4} /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>),
  cart: (<><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6" /><circle cx={9} cy={20} r={1.5} /><circle cx={18} cy={20} r={1.5} /></>),
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M5 12h14M12 5v14" />,
  minus: <path d="M5 12h14" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  sort: (<><path d="M4 7h9M4 12h6M4 17h3" /><path d="M17 5v14M14 16l3 3 3-3" /></>),
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, title, className }: { name: IconName; size?: number; title?: string; className?: string }) {
  return (
    <svg className={cx("gs-icon", className)} width={size} height={size} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false">
      {title ? <title>{title}</title> : null}
      {PATHS[name] ?? PATHS.close}
    </svg>
  );
}

/* ---------- Button ---------- */
type BtnBase = { variant?: "primary" | "secondary" | "dark" | "ghost" | "danger"; size?: "L" | "M" | "S"; full?: boolean; icon?: IconName; className?: string; children: ReactNode };
export function Button({ variant = "secondary", size = "M", full, icon, className, children, href, disabled, ...rest }: BtnBase & { href?: string } & Omit<ComponentProps<"button">, "children">) {
  const cls = cx("gs-btn", `gs-btn--${variant}`, `gs-btn--${size.toLowerCase()}`, full && "gs-btn--full", className);
  const kids = (<>{icon ? <Icon name={icon} size={20} /> : null}<span>{children}</span></>);
  if (href) {
    const label = rest["aria-label"];
    if (disabled) return <a className={cls} aria-disabled="true" role="link" aria-label={label}>{kids}</a>;
    return <Link className={cls} href={href} aria-label={label}>{kids}</Link>;
  }
  return <button className={cls} type={rest.type ?? "button"} disabled={!!disabled} {...rest}>{kids}</button>;
}

/* ---------- CountBadge / IconButton ---------- */
export function CountBadge({ count, decorative }: { count?: number; decorative?: boolean }) {
  if (!count || count <= 0) return null;
  return <span className="gs-badge" aria-hidden={decorative ? true : undefined}>{count > 99 ? "99+" : count}</span>;
}

export function IconButton({ icon, label, badge, href, className, ...rest }: { icon: IconName; label: string; badge?: number; href?: string; className?: string } & Omit<ComponentProps<"button">, "children">) {
  const aria = label + (badge && badge > 0 ? `, ${badge}개` : "");
  const kids = (<><Icon name={icon} />{badge && badge > 0 ? <CountBadge count={badge} decorative /> : null}</>);
  if (href) return <Link className={cx("gs-icon-btn", className)} href={href} aria-label={aria}>{kids}</Link>;
  return <button type="button" className={cx("gs-icon-btn", className)} aria-label={aria} {...rest}>{kids}</button>;
}

/* ---------- Label ---------- */
const LABEL_TEXT = { new: "NEW", best: "BEST", soldout: "품절", stopped: "판매 중지" } as const;
export function Label({ kind = "new", children }: { kind?: keyof typeof LABEL_TEXT; children?: ReactNode }) {
  return <span className={cx("gs-label", `gs-label--${kind}`)}>{children ?? LABEL_TEXT[kind]}</span>;
}

/* ---------- Fields ---------- */
type FieldProps = { label: string; id: string; hint?: string; error?: string; className?: string };
function FieldFoot({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) return <span id={`${id}-error`} className="gs-field__error">{error}</span>;
  if (hint) return <span id={`${id}-hint`} className="gs-field__hint">{hint}</span>;
  return null;
}
const describedBy = (id: string, hint?: string, error?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextField({ label, id, hint, error, className, ...input }: FieldProps & Omit<ComponentProps<"input">, "id">) {
  return (
    <div className={cx("gs-field", className)}>
      <label className="gs-field__label" htmlFor={id}>{label}</label>
      <input id={id} className="gs-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...input} />
      <FieldFoot id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({ label, id, hint, error, className, ...input }: FieldProps & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <div className={cx("gs-field", className)}>
      <label className="gs-field__label" htmlFor={id}>{label}</label>
      <textarea id={id} className="gs-input gs-textarea" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...input} />
      <FieldFoot id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({ label, id, hint, error, className, options, placeholder, ...sel }: FieldProps & { options: { value: string; label: string; disabled?: boolean }[]; placeholder?: string } & Omit<ComponentProps<"select">, "id">) {
  return (
    <div className={cx("gs-field", className)}>
      <label className="gs-field__label" htmlFor={id}>{label}</label>
      <div className="gs-select-wrap">
        <select id={id} className="gs-select" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...sel}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
        <Icon name="chevron-right" />
      </div>
      <FieldFoot id={id} hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({ label, className, ...input }: { label: ReactNode; className?: string } & Omit<ComponentProps<"input">, "type">) {
  return <label className={cx("gs-check", input.disabled && "gs-check--disabled", className)}><input type="checkbox" {...input} /><span>{label}</span></label>;
}
export function Radio({ label, className, ...input }: { label: ReactNode; className?: string } & Omit<ComponentProps<"input">, "type">) {
  return <label className={cx("gs-check", input.disabled && "gs-check--disabled", className)}><input type="radio" {...input} /><span>{label}</span></label>;
}

/* ---------- CategoryTabs / SectionHeader ---------- */
export function CategoryTabs({ items, current, flush, label = "카테고리" }: { items: { label: string; href: string }[]; current?: string; flush?: boolean; label?: string }) {
  return (
    <nav className={cx("gs-tabs", flush && "gs-tabs--flush")} aria-label={label}>
      {items.map((it) => <Link key={it.href + it.label} href={it.href} className="gs-tab" aria-current={current === it.label ? "page" : undefined}>{it.label}</Link>)}
    </nav>
  );
}

export function SectionHeader({ title, linkText, href, desktop, as: Tag = "h2" }: { title: string; linkText?: string; href?: string; desktop?: boolean; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cx("gs-section-head", desktop && "gs-section-head--desktop")}>
      <Tag>{title}</Tag>
      {linkText && href ? <Link className="gs-link" href={href}><span>{linkText} →</span></Link> : null}
    </div>
  );
}

/* ---------- ProductCard ---------- */
export function ProductCard({ href, name, price, imageUrl, label, rank }: { href: string; name: string; price: string; imageUrl?: string | null; label?: keyof typeof LABEL_TEXT; rank?: number }) {
  return (
    <Link className="gs-card" href={href}>
      <div className="gs-card__img" role="img" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 선 그림 SVG·업로드 이미지(URL), 최적화 불필요 */}
        {imageUrl ? <img src={imageUrl} alt="" /> : <span className="caption">[상품 이미지]</span>}
      </div>
      <div className="gs-card__meta">
        {rank != null ? <span className="gs-card__rank">{rank < 10 ? `0${rank}` : rank}</span> : null}
        {label ? <Label kind={label} /> : null}
        <span className="gs-card__name">{name}</span>
        <span className="gs-card__price">{price}</span>
      </div>
    </Link>
  );
}

/* ---------- OrderSummary / StickyBar / EmptyState / Notice / Pill / Dialog ---------- */
export function OrderSummary({ rows, total }: { rows: { label: string; value: string }[]; total?: { label: string; value: string } }) {
  return (
    <dl className="gs-summary">
      {rows.map((r) => <div key={r.label} className="gs-summary__row"><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
      {total ? <div className="gs-summary__row gs-summary__total"><dt>{total.label}</dt><dd>{total.value}</dd></div> : null}
    </dl>
  );
}

export function StickyBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("gs-sticky", className)}>{children}</div>;
}

export function EmptyState({ title, text, actionText, href, as: Tag = "p" }: { title: string; text?: string; actionText?: string; href?: string; as?: "p" | "h1" | "h2" }) {
  return (
    <div className="gs-empty">
      <Tag className="gs-empty__title">{title}</Tag>
      {text ? <p className="gs-empty__text">{text}</p> : null}
      {actionText && href ? <Button variant="dark" href={href}>{actionText}</Button> : null}
    </div>
  );
}

export function Notice({ children, live, className, tone }: { children: ReactNode; live?: boolean; className?: string; tone?: "danger" }) {
  return <p className={cx("gs-notice", tone === "danger" && "gs-notice--danger", className)} role={live ? (tone === "danger" ? "alert" : "status") : undefined}>{children}</p>;
}

export function InfoPill({ children }: { children: ReactNode }) {
  return <span className="gs-pill">{children}</span>;
}

export function SortLink({ label, href }: { label: string; href: string }) {
  return (
    <Link className="gs-sort" href={href} aria-label={`정렬: ${label}`}>
      <Icon name="sort" size={20} /><span aria-hidden="true">{label}</span>
    </Link>
  );
}

export { won } from "@/lib/format";
