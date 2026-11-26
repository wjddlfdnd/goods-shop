"use client";
// 공통 서버·네트워크 오류(PRD 7.10): 안내 + 다시 시도
import { Button, EmptyState } from "@/components/ui";

export default function ShopError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="page container stack-4">
      <EmptyState title="잠시 문제가 생겼습니다" text="네트워크나 서버 오류로 화면을 불러오지 못했습니다." />
      <div style={{ display: "flex", justifyContent: "center" }}><Button variant="dark" onClick={() => retry()}>다시 시도</Button></div>
    </main>
  );
}
