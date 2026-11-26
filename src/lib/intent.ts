// 로그인 후 원래 행동 복귀(U-02, PRD 4.2 시나리오 1).
// 비회원이 장바구니 담기·바로 구매를 누르면 /login?next=<상품 경로>&intent=cart:<옵션ID>:<수량> 으로 보낸다.
export type Intent = { type: "cart" | "buy" | "wish"; optionId: string; quantity: number }; // wish는 optionId 자리에 상품 ID

export function parseIntent(raw: unknown): Intent | null {
  if (typeof raw !== "string") return null;
  const [type, optionId, q] = raw.split(":");
  const quantity = Number(q);
  if ((type !== "cart" && type !== "buy" && type !== "wish") || !optionId || !Number.isInteger(quantity) || quantity < 1) return null;
  return { type, optionId, quantity };
}

export const formatIntent = (i: Intent) => `${i.type}:${i.optionId}:${i.quantity}`;

export const loginUrl = (next: string, intent?: Intent) =>
  `/login?next=${encodeURIComponent(next)}${intent ? `&intent=${encodeURIComponent(formatIntent(intent))}` : ""}`;
