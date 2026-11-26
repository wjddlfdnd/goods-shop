// 주문 단계 표시(데스크톱): 장바구니 → 주문서 → 주문 완료, 현재 단계 강조(DESIGN 4.1)
const STEPS = ["장바구니", "주문서", "주문 완료"];
export function OrderSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="order-steps only-desktop" aria-label="주문 단계">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i + 1 === current ? "step" : undefined} className="body-sm-14">
          <span className="order-steps__num caption">{i + 1}</span>{s}{i + 1 < current ? <span className="sr-only">(완료)</span> : null}
        </li>
      ))}
    </ol>
  );
}
