"use client";
// 관리자 화면 오류(QA2-02): 관리자 틀(헤더·메뉴)은 그대로 두고 본문에 안내 + 다시 시도
import { Button } from "@/components/ui";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="gs-panel"><div className="gs-empty">
      <h1 className="gs-empty__title">잠시 문제가 생겼습니다</h1>
      <p className="gs-empty__text">화면을 불러오지 못했습니다. 입력한 검색 조건을 확인하거나 다시 시도해 주세요.</p>
      <div className="row" style={{ justifyContent: "center" }}><Button variant="dark" onClick={() => retry()}>다시 시도</Button><Button href="/admin/dashboard">대시보드로</Button></div>
    </div></div>
  );
}
