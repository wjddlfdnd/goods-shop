import { ProductCard } from "../ui";
import { won } from "@/lib/format";
import type { ProductSummary } from "@/lib/catalog";

export function ProductGrid({ products, ranked }: { products: ProductSummary[]; ranked?: boolean }) {
  return (
    <div className="card-grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} href={`/products/${p.id}`} name={p.name} price={won(p.price)} imageUrl={p.imageUrl}
          rank={ranked ? i + 1 : undefined} label={p.soldOut ? "soldout" : p.isNew && !ranked ? "new" : undefined} />
      ))}
    </div>
  );
}
