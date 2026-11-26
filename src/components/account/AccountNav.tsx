import Link from "next/link";
import { Icon } from "../ui";

// 마이페이지 메뉴(2차): 내 정보 · 배송지 · 주문 내역 · 찜 목록
export const ACCOUNT_MENU = [
  { href: "/account/profile", label: "내 정보 수정", desc: "이름·연락처" },
  { href: "/account/addresses", label: "배송지 관리", desc: "기본 배송지 지정" },
  { href: "/account/orders", label: "주문 내역", desc: "주문 상세·결제 완료 주문 취소" },
  { href: "/account/wishlist", label: "찜 목록", desc: "관심 상품 모아 보기" },
] as const;

export function AccountNav() {
  return (
    <nav aria-label="마이페이지 메뉴">
      <ul className="m-0" style={{ padding: 0, listStyle: "none" }}>
        {ACCOUNT_MENU.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="row row--between" style={{ minHeight: "var(--touch-min)", padding: "var(--space-3) 0", borderBottom: "var(--line-width) solid var(--line)", textDecoration: "none" }}>
              <span className="stack-2" style={{ gap: 0 }}><b className="body-15 text-ink">{m.label}</b><span className="caption text-sub">{m.desc}</span></span>
              <Icon name="chevron-right" size={20} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
