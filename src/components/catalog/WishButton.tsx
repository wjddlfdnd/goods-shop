"use client";
import { useOptimistic, useTransition } from "react";
import { toggleWishAction } from "@/lib/actions/wishlist";
import { Icon, cx } from "../ui";

// 찜 버튼(U-06): 누르면 찜, 다시 누르면 해제. 상태는 aria-pressed로 알린다
export function WishButton({ productId, name, wished, back, className }: { productId: string; name: string; wished: boolean; back: string; className?: string }) {
  const [on, setOn] = useOptimistic(wished);
  const [pending, start] = useTransition();
  return (
    <button type="button" className={cx("gs-icon-btn wish-btn", className)} aria-pressed={on} aria-label={on ? `${name} 찜 해제` : `${name} 찜하기`} disabled={pending}
      onClick={() => start(async () => { setOn(!on); await toggleWishAction(productId, back); })}>
      <Icon name="heart" />
    </button>
  );
}
