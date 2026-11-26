// 로그인 직후 원래 행동 실행. 장바구니 담기·바로 구매는 feature-cart·feature-order에서 연결한다.
import type { Intent } from "@/lib/intent";

export async function runIntent(_userId: string, _intent: Intent, next: string): Promise<string> {
  return next;
}
