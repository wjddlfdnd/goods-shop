import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminProduct, listAdminProducts } from "@/lib/admin";
import { Button, Icon, Label, Notice } from "@/components/ui";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
import { ImagePanel } from "@/components/admin/ImagePanel";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { won } from "@/lib/format";

// 관리자 상품 관리(A-02–A-04): 목록(카테고리·판매 상태·상품명 필터, 20개씩) + 등록·수정 패널(?edit=<id>|new)
export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return <Suspense fallback={<p className="caption">불러오는 중…</p>}><Content searchParams={searchParams} /></Suspense>;
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

async function Content({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const f = { categoryId: str(sp.category), status: sp.status === "ON_SALE" || sp.status === "STOPPED" ? (sp.status as "ON_SALE" | "STOPPED") : undefined, q: str(sp.q), page: Number(sp.page) || 1 };
  const [list, categories] = await Promise.all([listAdminProducts(f), db.category.findMany({ orderBy: [{ isSystem: "asc" }, { sortOrder: "asc" }] })]);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ category: f.categoryId, status: f.status, q: f.q, page: String(f.page), ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/products?${p}`;
  };
  return (
    <div className="stack-8">
      <div className="row row--between">
        <div>
          <h1 className="heading-sm-desktop m-0">상품 관리</h1>
          <p className="body-sm-14 text-sub m-0">상품 <b className="text-ink">{list.total}</b>개 · 판매 중 {list.onSale} · 판매 중지 {list.stopped}</p>
        </div>
        <Button variant="primary" icon="plus" href="/admin/products?edit=new">상품 등록</Button>
      </div>
      {sp.saved ? <Notice live>저장했습니다.</Notice> : sp.deleted ? <Notice live>상품을 삭제했습니다.</Notice> : null}

      <form className="gs-panel row" style={{ flexWrap: "wrap", alignItems: "flex-end", gap: "var(--space-4)" }} aria-label="상품 필터" action="/admin/products">
        <div className="gs-field" style={{ minWidth: "calc(var(--thumb-width) * 2)" }}>
          <label className="gs-field__label" htmlFor="f-cat">카테고리</label>
          <div className="gs-select-wrap"><select id="f-cat" name="category" className="gs-select" defaultValue={f.categoryId ?? ""}>
            <option value="">전체</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select><Icon name="chevron-right" /></div>
        </div>
        <div className="gs-field" style={{ minWidth: "calc(var(--thumb-width) * 2)" }}>
          <label className="gs-field__label" htmlFor="f-status">판매 상태</label>
          <div className="gs-select-wrap"><select id="f-status" name="status" className="gs-select" defaultValue={f.status ?? ""}>
            <option value="">전체</option><option value="ON_SALE">판매 중</option><option value="STOPPED">판매 중지</option>
          </select><Icon name="chevron-right" /></div>
        </div>
        <div className="gs-field" style={{ flex: 1 }}>
          <label className="gs-field__label" htmlFor="f-q">상품명 검색어</label>
          <input id="f-q" name="q" className="gs-input" placeholder="상품명으로 검색" defaultValue={f.q} />
        </div>
        <Button type="submit" variant="dark">검색</Button>
      </form>

      {list.items.length ? (
        <div className="gs-table-wrap gs-panel">
          <table className="gs-table">
            <caption className="sr-only">상품 목록 {list.items.length}개</caption>
            <thead><tr>{["썸네일", "상품명", "카테고리", "판매가", "옵션 수", "총 재고", "판매 상태", "동작"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id}>
                  <td><div className="line-item__thumb" style={{ width: "calc(var(--thumb-width) / 2)", height: "auto", aspectRatio: "4 / 5" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl ? <img src={p.imageUrl} alt="" /> : null}</div></td>
                  <th scope="row">
                    <span className="stack-2" style={{ gap: "var(--space-1)" }}>
                      <span>{p.name}</span>
                      {p.hasOrders ? <span className="caption text-sub">주문 이력 있음</span> : null}
                      {p.totalStock === 0 ? <span className="caption text-danger">모든 옵션 품절</span> : null}
                      {p.category.isSystem ? <span className="caption text-danger">카테고리를 바꿔야 판매할 수 있음</span> : null}
                    </span>
                  </th>
                  <td>{p.category.name}</td>
                  <td>{won(p.price)}</td>
                  <td>{p.defaultOnly ? "1 (기본)" : p.optionCount}</td>
                  <td>{p.totalStock === 0 ? <Label kind="soldout" /> : p.totalStock}</td>
                  <td>{p.status === "ON_SALE" ? "판매 중" : <Label kind="stopped" />}</td>
                  <td><span className="row"><Button size="S" href={qs({ edit: p.id })} aria-label={`${p.name} 수정`}>수정</Button><DeleteProductButton id={p.id} name={p.name} hasOrders={p.hasOrders} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="gs-panel"><div className="gs-empty"><p className="gs-empty__title">조건에 맞는 상품이 없습니다</p><Button variant="dark" href="/admin/products?edit=new">상품 등록</Button></div></div>
      )}
      {list.pages > 1 ? (
        <nav className="row" style={{ justifyContent: "center" }} aria-label="페이지">
          {Array.from({ length: list.pages }, (_, i) => i + 1).map((n) => <Link key={n} href={qs({ page: String(n) })} aria-current={n === list.page ? "page" : undefined} className="gs-btn gs-btn--s gs-btn--ghost">{n}</Link>)}
        </nav>
      ) : null}

      {typeof sp.edit === "string" ? <EditPanel id={sp.edit} categories={categories} /> : null}
    </div>
  );
}

async function EditPanel({ id, categories }: { id: string; categories: { id: string; name: string; isSystem: boolean }[] }) {
  const system = categories.find((c) => c.isSystem) ?? null;
  const normal = categories.filter((c) => !c.isSystem); // 등록·수정 선택지에서 미분류 제외(D-12)
  if (id === "new") {
    const data: ProductFormData = { name: "", price: "", description: "", categoryId: "", status: "ON_SALE", options: [] };
    return (
      <section className="gs-panel stack-6" aria-label="상품 등록" id="edit">
        <h2 className="heading-xs m-0">상품 등록</h2>
        <ProductForm product={data} categories={normal} systemCategory={null} />
        <p className="caption text-sub m-0">이미지는 상품을 저장한 뒤 올릴 수 있습니다.</p>
      </section>
    );
  }
  const p = await getAdminProduct(id);
  if (!p) notFound();
  const data: ProductFormData = {
    id: p.id, name: p.name, price: String(p.price), description: p.description, categoryId: p.categoryId, status: p.status,
    options: p.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extraPrice, stock: o.stock, isDefault: o.isDefault, hasOrders: o._count.orderItems > 0 })),
  };
  return (
    <section className="gs-panel stack-6" aria-label="상품 수정" id="edit">
      <h2 className="heading-xs m-0">상품 수정 <span className="body-sm-14 text-sub">{p.name}</span></h2>
      <div className="split">
        <ProductForm key={p.id} product={data} categories={normal} systemCategory={p.category.isSystem ? { id: system!.id, name: system!.name } : null} />
        <ImagePanel productId={p.id} images={p.images.map((i) => ({ id: i.id, url: i.url, kind: i.kind }))} />
      </div>
    </section>
  );
}
