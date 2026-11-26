import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { EmptyState } from "@/components/ui";

// 존재하지 않는 상품·주문(PRD 7.10, M-Detail--notfound)
export default function NotFound() {
  return (
    <>
      <MobileSubHeader back="/" />
      <main className="page container">
        <EmptyState title="상품을 찾을 수 없습니다" text="주소가 바뀌었거나 삭제된 상품입니다." actionText="홈으로 가기" href="/" />
      </main>
    </>
  );
}
