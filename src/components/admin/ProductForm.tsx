"use client";
// 관리자 상품 등록·수정(A-02·A-04): 기본 정보·옵션·재고. 오류가 나도 입력값을 그대로 둔다(제어 입력 + onSubmit).
import { startTransition, useActionState, useState } from "react";
import { saveProductAction, type AdminState } from "@/lib/actions/admin";
import { Button, IconButton, Notice, SelectField, TextArea, TextField } from "../ui";

type Opt = { key: string; id?: string; name: string; extraPrice: string; stock: string; locked: boolean };
export type ProductFormData = {
  id?: string; name: string; price: string; description: string; categoryId: string; status: "ON_SALE" | "STOPPED";
  options: { id: string; name: string; extraPrice: number; stock: number; isDefault: boolean; hasOrders: boolean }[];
};

export function ProductForm({ product, categories, systemCategory }: {
  product: ProductFormData; categories: { id: string; name: string }[]; systemCategory: { id: string; name: string } | null;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProductAction, undefined);
  const [v, setV] = useState({ name: product.name, price: product.price, description: product.description, categoryId: product.categoryId, status: product.status });
  const [opts, setOpts] = useState<Opt[]>(
    product.options.filter((o) => !o.isDefault).map((o) => ({ key: o.id, id: o.id, name: o.name, extraPrice: String(o.extraPrice), stock: String(o.stock), locked: o.hasOrders })),
  );
  const defaultOpt = product.options.find((o) => o.isDefault);
  const [defaultStock, setDefaultStock] = useState(String(defaultOpt?.stock ?? 0));
  const e = state?.errors ?? {};
  const inSystem = !!systemCategory && v.categoryId === systemCategory.id;
  const catOptions = [...categories.map((c) => ({ value: c.id, label: c.name })), ...(inSystem && systemCategory ? [{ value: systemCategory.id, label: `${systemCategory.name} (현재)` }] : [])];
  const totalStock = opts.length ? opts.reduce((s, o) => s + (Number(o.stock) || 0), 0) : Number(defaultStock) || 0;
  const upd = (i: number, k: keyof Opt) => (ev: React.ChangeEvent<HTMLInputElement>) => setOpts(opts.map((o, j) => (j === i ? { ...o, [k]: ev.target.value } : o)));

  return (
    <form className="stack-8" noValidate onSubmit={(ev) => { ev.preventDefault(); const fd = new FormData(ev.currentTarget); startTransition(() => action(fd)); }}>
      {product.id ? <input type="hidden" name="id" value={product.id} /> : null}
      {state?.message ? <Notice live tone="danger">{state.message}</Notice> : null}
      <section className="stack-4">
        <h3 className="heading-xs m-0">기본 정보</h3>
        <TextField id="p-name" name="name" label="상품명" value={v.name} onChange={(x) => setV({ ...v, name: x.target.value })} error={e.name} required />
        <div className="field-row field-row--2">
          <SelectField id="p-cat" name="categoryId" label="카테고리" placeholder="카테고리를 선택하세요" options={catOptions} value={v.categoryId}
            onChange={(x) => setV({ ...v, categoryId: x.target.value })} error={e.categoryId} hint={inSystem ? "미분류 상품은 카테고리를 고른 뒤에 판매 중으로 바꿀 수 있습니다." : undefined} />
          <TextField id="p-price" name="price" label="판매가(원)" type="number" inputMode="numeric" min={0} value={v.price} onChange={(x) => setV({ ...v, price: x.target.value })} error={e.price} required />
        </div>
        <SelectField id="p-status" name="status" label="판매 상태" options={[{ value: "ON_SALE", label: "판매 중" }, { value: "STOPPED", label: "판매 중지" }]}
          value={v.status} onChange={(x) => setV({ ...v, status: x.target.value as "ON_SALE" | "STOPPED" })} error={e.status} />
        <TextArea id="p-desc" name="description" label="상품 설명" value={v.description} onChange={(x) => setV({ ...v, description: x.target.value })} hint="재질·크기·구성 같은 상세 정보도 설명에 적어 주세요." />
      </section>

      <section className="stack-4">
        <div className="row row--between">
          <h3 className="heading-xs m-0">옵션·재고 <span className="body-sm-13 text-sub">옵션 {opts.length || 1}개{opts.length ? "" : "(기본)"} · 총 재고 {totalStock}</span></h3>
          <Button size="S" icon="plus" onClick={() => setOpts([...opts, { key: crypto.randomUUID(), name: "", extraPrice: "0", stock: "0", locked: false }])}>옵션 추가</Button>
        </div>
        {opts.length ? (
          <div className="gs-table-wrap">
            <table className="gs-table">
              <caption className="sr-only">옵션·재고</caption>
              <thead><tr><th scope="col">옵션명</th><th scope="col">추가금(원)</th><th scope="col">재고</th><th scope="col">삭제</th></tr></thead>
              <tbody>
                {opts.map((o, i) => (
                  <tr key={o.key}>
                    <td>{o.id ? <input type="hidden" name={`opt-${i}-id`} value={o.id} /> : null}
                      <input className="gs-input" name={`opt-${i}-name`} aria-label={`옵션 ${i + 1} 옵션명`} value={o.name} onChange={upd(i, "name")} aria-invalid={e[`opt-${i}-name`] ? true : undefined} /></td>
                    <td><input className="gs-input" name={`opt-${i}-extraPrice`} type="number" min={0} inputMode="numeric" aria-label={`옵션 ${i + 1} 추가금(원)`} value={o.extraPrice} onChange={upd(i, "extraPrice")} aria-invalid={e[`opt-${i}-extraPrice`] ? true : undefined} /></td>
                    <td><input className="gs-input" name={`opt-${i}-stock`} type="number" min={0} inputMode="numeric" aria-label={`옵션 ${i + 1} 재고`} value={o.stock} onChange={upd(i, "stock")} aria-invalid={e[`opt-${i}-stock`] ? true : undefined} /></td>
                    <td>{o.locked
                      ? <span className="caption text-sub nowrap" title="주문 이력이 있는 옵션은 삭제할 수 없습니다. 재고를 0으로 바꿔 주세요.">삭제 불가</span>
                      : <IconButton icon="close" label={`옵션 ${i + 1} 삭제`} onClick={() => setOpts(opts.filter((_, j) => j !== i))} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // 옵션이 없으면 기본 옵션 1개(D-6): 재고만 입력
          <>
            <TextField id="p-stock" name="defaultStock" label="재고(기본 옵션)" type="number" min={0} inputMode="numeric" value={defaultStock} onChange={(x) => setDefaultStock(x.target.value)} error={e.defaultStock} />
          </>
        )}
        {Object.keys(e).filter((k) => k.startsWith("opt-") || (k === "defaultStock" && opts.length)).map((k) => <p key={k} className="body-sm-13 text-danger m-0">{e[k]}</p>)}
        <p className="caption text-sub m-0">옵션을 모두 지우고 저장하면 기본 옵션 1개(추가금 0원)가 만들어집니다 · 재고는 0 이상만 저장할 수 있습니다 · 주문 이력이 있는 옵션은 삭제할 수 없고 재고 0으로 품절 처리합니다.</p>
      </section>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button href="/admin/products">취소</Button>
        <Button type="submit" variant="dark" disabled={pending}>{pending ? "저장 중…" : "저장"}</Button>
      </div>
    </form>
  );
}
