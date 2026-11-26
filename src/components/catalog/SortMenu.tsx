import Link from "next/link";
import { Icon } from "../ui";
import { SORTS, sortLabel, type Sort } from "@/lib/catalog";

// 정렬(P-04): 정렬 아이콘 + 현재 정렬 이름, 누르면 4개 목록(DESIGN SortButton)
export function SortMenu({ current, hrefFor }: { current: Sort; hrefFor: (s: Sort) => string }) {
  return (
    <details className="sort-menu">
      <summary className="gs-sort" aria-label={`정렬: ${sortLabel(current)}`}><Icon name="sort" size={20} /><span aria-hidden="true">{sortLabel(current)}</span></summary>
      <ul className="sort-menu__list">
        {SORTS.map((s) => <li key={s.value}><Link href={hrefFor(s.value)} aria-current={s.value === current ? "true" : undefined} className="body-sm-14">{s.label}</Link></li>)}
      </ul>
    </details>
  );
}
