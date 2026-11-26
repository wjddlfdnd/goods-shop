import { Suspense } from "react";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { OrderSteps } from "@/components/cart/OrderSteps";
import { CheckoutForm } from "@/components/order/CheckoutForm";
import { EmptyState, Notice } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { checkoutLines, checkoutPrefill, parseSource } from "@/lib/order";
import { safeNext } from "@/lib/auth";

// 주문서(O-03·O-04). /checkout?items=<장바구니 항목>(장바구니 경유) 또는 ?buy=<옵션>:<수량>(바로 구매)
export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <>
      <MobileSubHeader back="/cart" cart={false} />
      <main className="page container">
        <div className="row row--between" style={{ flexWrap: "wrap" }}>
          <h1 className="page-title heading-lg-mobile">주문서</h1>
          <OrderSteps current={2} />
        </div>
        <Suspense fallback={<p className="caption">불러오는 중…</p>}><Checkout searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}

async function Checkout({ searchParams }: { searchParams: PageProps<"/checkout">["searchParams"] }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cart");
  const source = parseSource(sp);
  const back = source?.from === "buy"
    ? { href: safeNext(sp.back, "/products"), label: "상품으로 돌아가기" }
    : { href: "/cart", label: "장바구니로 돌아가기" };
  const lines = source ? await checkoutLines(user.id, source) : [];
  if (!lines.length) return <EmptyState title="주문할 상품이 없습니다" text="장바구니에서 주문할 상품을 선택해 주세요." actionText="장바구니로 가기" href="/cart" />;
  // 장바구니 경유: 그 사이 구매 불가가 생겼으면 장바구니로 돌려 사유를 보여 준다(O-02)
  if (source?.from === "cart" && lines.some((l) => l.problem)) redirect("/cart");
  if (source?.from === "buy" && lines[0].problem) {
    return (
      <div className="stack-6">
        <Notice live tone="danger"><strong>{lines[0].problem.code === "UNAVAILABLE" ? "판매가 중지된 상품입니다." : "재고가 부족해 주문할 수 없습니다."}</strong><br />{lines[0].productName} · {lines[0].problem.message}</Notice>
        <EmptyState title="주문할 수 없습니다" actionText="상품으로 돌아가기" href={back.href} />
      </div>
    );
  }
  const prefill = await checkoutPrefill(user.id);
  return (
    <CheckoutForm lines={lines} prefill={prefill} idempotencyKey={randomUUID()} back={back}
      source={{ items: typeof sp.items === "string" ? sp.items : undefined, buy: typeof sp.buy === "string" ? sp.buy : undefined }} />
  );
}
