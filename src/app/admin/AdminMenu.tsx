"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 관리자 메뉴(PRD v1.7): 상품 관리 · 카테고리 관리 · 주문 관리(2차) · 대시보드(2차)
export function AdminMenu() {
  const path = usePathname();
  const item = (href: string, label: string) => <li><Link href={href} aria-current={path.startsWith(href) ? "page" : undefined} className="body-sm-14">{label}</Link></li>;
  return (
    <nav className="admin__menu" aria-label="관리자 메뉴">
      <ul>
        {item("/admin/products", "상품 관리")}
        {item("/admin/categories", "카테고리 관리")}
        <li><span className="body-sm-14" aria-disabled="true">주문 관리<span className="caption">(2차)</span></span></li>
        <li><span className="body-sm-14" aria-disabled="true">대시보드<span className="caption">(2차)</span></span></li>
      </ul>
    </nav>
  );
}
