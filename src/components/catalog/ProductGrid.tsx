import { ProductCard } from "../ui";
import { WishButton } from "./WishButton";
import { won } from "@/lib/format";
import type { ProductSummary } from "@/lib/catalog";

// 상품 카드 그리드. wished가 있으면 찜 버튼(2차, D-13)을 함께 그린다
export function ProductGrid({ products, ranked, wished, back = "/" }: { products: ProductSummary[]; ranked?: boolean; wished?: Set<string>; back?: string }) {
  return (
    <div className="card-grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} href={`/products/${p.id}`} name={p.name} price={won(p.price)} imageUrl={p.imageUrl}
          rank={ranked ? i + 1 : undefined} label={p.soldOut ? "soldout" : p.isNew && !ranked ? "new" : undefined}
          action={wished ? <WishButton productId={p.id} name={p.name} wished={wished.has(p.id)} back={back} /> : undefined} />
      ))}
    </div>
  );
}
