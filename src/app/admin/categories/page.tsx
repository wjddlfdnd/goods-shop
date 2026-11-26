import { Suspense } from "react";
import { connection } from "next/server";
import { listAdminCategories } from "@/lib/admin";
import { CategoryTable } from "@/components/admin/CategoryTable";

// 관리자 카테고리 관리(A-05)
export default function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  return <Suspense fallback={<p className="caption">불러오는 중…</p>}><Content searchParams={searchParams} /></Suspense>;
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/categories">["searchParams"] }) {
  await connection();
  const [categories, sp] = await Promise.all([listAdminCategories(), searchParams]);
  const moved = Number(sp.moved) || 0;
  const done = sp.done === "added" ? "카테고리를 추가했습니다." : sp.done === "deleted" ? (moved ? `카테고리를 삭제하고 판매 중지 상품 ${moved}개를 미분류로 옮겼습니다.` : "카테고리를 삭제했습니다.") : undefined;
  return <CategoryTable key={categories.map((c) => `${c.id}${c.name}${c.onSale}${c.stopped}`).join()} categories={categories} done={done} />;
}
