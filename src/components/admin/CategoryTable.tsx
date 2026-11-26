"use client";
// 관리자 카테고리 관리(A-05, D-12): 추가·이름 수정·삭제. 판매 중 상품이 있으면 삭제 불가,
// 판매 중지 상품만 남았으면 "미분류로 이동" 확인 후 삭제. 미분류는 수정·삭제 불가.
import Link from "next/link";
import { useActionState, useState } from "react";
import { createCategoryAction, deleteCategoryAction, renameCategoryAction, type AdminState } from "@/lib/actions/admin";
import { Button, Notice, TextField } from "../ui";

type Cat = { id: string; name: string; isSystem: boolean; onSale: number; stopped: number };

export function CategoryTable({ categories, done }: { categories: Cat[]; done?: string }) {
  const [addState, add, adding] = useActionState<AdminState, FormData>(createCategoryAction, undefined);
  const [renState, rename] = useActionState<AdminState, FormData>(renameCategoryAction, undefined);
  const [delState, del, deleting] = useActionState<AdminState, FormData>(deleteCategoryAction, undefined);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const normalCount = categories.filter((c) => !c.isSystem).length;

  return (
    <div className="stack-8">
      <div className="row row--between">
        <div>
          <h1 className="heading-sm-desktop m-0">카테고리 관리</h1>
          <p className="body-sm-14 text-sub m-0">카테고리 <b className="text-ink">{normalCount}</b>개 + 미분류</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>카테고리 추가</Button>
      </div>
      <Notice>판매 중 상품이 연결된 카테고리는 삭제할 수 없습니다. 먼저 상품의 카테고리를 바꾸거나 판매 중지하세요. 삭제하면 연결된 판매 중지 상품은 미분류로 옮겨집니다.</Notice>
      {showAdd ? (
        <form action={add} className="gs-panel row" style={{ alignItems: "flex-end", gap: "var(--space-4)" }}>
          <TextField id="cat-new" name="name" label="새 카테고리 이름" className="stack-2" error={addState?.message} autoFocus />
          <Button type="submit" variant="dark" disabled={adding}>추가</Button>
          <Button onClick={() => setShowAdd(false)}>닫기</Button>
        </form>
      ) : null}
      {done ? <Notice live>{done}</Notice> : null}
      {delState?.message ? <Notice live tone="danger">{delState.message}</Notice> : null}

      <div className="gs-table-wrap gs-panel">
        <table className="gs-table">
          <caption className="sr-only">카테고리 목록</caption>
          <thead><tr><th scope="col">이름</th><th scope="col">판매 중 상품 수</th><th scope="col">판매 중지 상품 수</th><th scope="col">동작</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  {editing === c.id ? (
                    <form action={rename} className="row">
                      <input type="hidden" name="id" value={c.id} />
                      <input className="gs-input" name="name" defaultValue={c.name} aria-label={`${c.name} 카테고리 이름`} autoFocus />
                      <Button type="submit" size="S" variant="dark">저장</Button>
                      <Button size="S" onClick={() => setEditing(null)}>취소</Button>
                    </form>
                  ) : <span className="row">{c.name}{c.isSystem ? <span className="gs-pill">시스템</span> : null}</span>}
                  {editing === c.id && renState?.message ? <p className="caption text-danger m-0">{renState.message}</p> : null}
                  {delState?.blocked?.id === c.id ? (
                    <div className="gs-notice gs-notice--danger" role="alert" style={{ marginTop: "var(--space-2)", border: "var(--line-width) solid var(--danger)" }}>
                      <strong>삭제할 수 없습니다.</strong><br />{delState.blocked.message}{" "}
                      <Link className="gs-link gs-link--strong" href={`/admin/products?category=${c.id}&status=ON_SALE`}>{c.name} 상품 보기 →</Link>
                    </div>
                  ) : null}
                  {delState?.confirm?.id === c.id ? (
                    <form action={del} className="gs-dialog stack-4" role="alertdialog" aria-labelledby={`del-${c.id}`} style={{ marginTop: "var(--space-2)" }}>
                      <input type="hidden" name="id" value={c.id} /><input type="hidden" name="confirm" value="true" />
                      <h2 id={`del-${c.id}`} className="gs-dialog__title">&apos;{c.name}&apos; 카테고리를 삭제할까요?</h2>
                      <p className="gs-dialog__text">연결된 판매 중지 상품 <b>{delState.confirm.stopped}개</b>가 <b>미분류</b>로 이동합니다. 다시 판매하려면 다른 카테고리로 변경해야 합니다.</p>
                      <div className="gs-dialog__actions"><Button href="/admin/categories">취소</Button><Button type="submit" variant="danger" disabled={deleting}>삭제</Button></div>
                    </form>
                  ) : null}
                </th>
                <td>{c.onSale}</td>
                <td>{c.stopped}</td>
                <td>
                  {c.isSystem ? <span className="caption text-sub">수정·삭제할 수 없는 시스템 항목</span> : (
                    <span className="row">
                      <Button size="S" onClick={() => setEditing(c.id)} aria-label={`${c.name} 카테고리 수정`}>수정</Button>
                      <form action={del}><input type="hidden" name="id" value={c.id} /><Button type="submit" size="S" variant="ghost" disabled={deleting} aria-label={`${c.name} 카테고리 삭제`}>삭제</Button></form>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
