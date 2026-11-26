"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 관리자 메뉴(PRD v1.7): 상품 관리 · 카테고리 관리 · 주문 관리 · 대시보드(2차부터 사용)
export function AdminMenu() {
  const path = usePathname();
  const item = (href: string, label: string) => <li><Link href={href} aria-current={path.startsWith(href) ? "page" : undefined} className="body-sm-14">{label}</Link></li>;
  return (
    <nav className="admin__menu" aria-label="관리자 메뉴">
      <ul>
        {item("/admin/products", "상품 관리")}
        {item("/admin/categories", "카테고리 관리")}
        {item("/admin/orders", "주문 관리")}
        {item("/admin/dashboard", "대시보드")}
      </ul>
    </nav>
  );
}
