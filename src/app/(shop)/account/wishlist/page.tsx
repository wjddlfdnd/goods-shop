import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { EmptyState, ProductCard } from "@/components/ui";
import { WishButton } from "@/components/catalog/WishButton";
import { getSessionUser } from "@/lib/auth";
import { listWishlist } from "@/lib/wishlist";
import { won } from "@/lib/format";

// 찜 목록(U-06, 2차). 0건이면 빈 상태 + 상품 목록 이동(7.10)
export default function WishlistPage() {
  return (
    <>
      <MobileSubHeader back="/account" title="찜 목록" />
      <main className="page container">
        <h1 className="page-title heading-lg-mobile sr-only-mobile">찜 목록</h1>
        <Suspense fallback={<p className="caption">불러오는 중…</p>}><List /></Suspense>
      </main>
    </>
  );
}

async function List() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/wishlist");
  const items = await listWishlist(user.id);
  if (!items.length) return <div className="mt-6"><EmptyState title="찜한 상품이 없습니다" text="마음에 드는 굿즈의 하트를 눌러 모아 보세요." actionText="상품 보러 가기" href="/products" /></div>;
  return (
    <div className="stack-4 mt-6">
      <p className="body-sm-14 text-sub m-0">찜한 상품 <b className="text-ink">{items.length}</b>개</p>
      <div className="card-grid">
        {items.map((p) => (
          <ProductCard key={p.id} href={`/products/${p.id}`} name={p.name} price={won(p.price)} imageUrl={p.imageUrl}
            label={p.stopped ? "stopped" : p.soldOut ? "soldout" : undefined}
            action={<WishButton productId={p.id} name={p.name} wished back="/account/wishlist" />} />
        ))}
      </div>
    </div>
  );
}
