import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="page container">
      <EmptyState title="페이지를 찾을 수 없습니다" text="주소를 다시 확인해 주세요." actionText="홈으로 가기" href="/" />
    </main>
  );
}
