"use client";
// 헤더·목록의 카테고리 탭. 현재 위치(/products?category=)를 강조한다.
import { usePathname, useSearchParams } from "next/navigation";
import { CategoryTabs } from "../ui";

export function CategoryNav({ categories, flush = true }: { categories: { id: string; name: string }[]; flush?: boolean }) {
  const path = usePathname();
  const cat = useSearchParams().get("category");
  const items = [{ label: "전체", href: "/products" }, ...categories.map((c) => ({ label: c.name, href: `/products?category=${c.id}` }))];
  const current = path === "/products" ? (categories.find((c) => c.id === cat)?.name ?? "전체") : undefined;
  return <CategoryTabs items={items} current={current} flush={flush} />;
}
