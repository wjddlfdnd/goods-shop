import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { CartView } from "@/components/cart/CartView";
import { Button, EmptyState, Notice } from "@/components/ui";
import { OrderSteps } from "@/components/cart/OrderSteps";
import { getSessionUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";

// 장바구니(O-02). 회원 전용(7.1)
export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <>
      <MobileSubHeader back="/" cart={false} />
      <main className="page container">
        <div className="row row--between" style={{ flexWrap: "wrap" }}>
          <h1 className="page-title heading-lg-mobile">장바구니</h1>
          <OrderSteps current={1} />
        </div>
        <Suspense fallback={<p className="caption">불러오는 중…</p>}><Cart searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}

async function Cart({ searchParams }: { searchParams: PageProps<"/cart">["searchParams"] }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cart");
  const [lines, sp] = await Promise.all([getCart(user.id), searchParams]);
  if (!lines.length) {
    return (
      <div className="stack-6">
        <EmptyState title="장바구니가 비어 있습니다" text="마음에 드는 굿즈를 골라 장바구니에 담아 보세요." actionText="상품 보러 가기" href="/products" />
        <div className="only-mobile"><Button variant="primary" size="L" full disabled>선택 상품 주문하기</Button><p className="caption text-sub" style={{ textAlign: "center" }}>장바구니에 담긴 상품이 없어 주문할 수 없습니다</p></div>
      </div>
    );
  }
  return (
    <div className="stack-6">
      {sp.added ? <Notice live>장바구니에 담았습니다.</Notice> : null}
      <CartView key={lines.map((l) => `${l.id}:${l.quantity}`).join("|")} lines={lines} />
    </div>
  );
}
