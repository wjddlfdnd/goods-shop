import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { formatPhone } from "@/lib/format";

// 내 계정(1차): 회원 정보 확인과 로그아웃(U-02). 정보 수정·배송지·주문 내역은 2차(U-03–U-05). (가정)
export default function AccountPage() {
  return (
    <>
      <MobileSubHeader back="/" title="내 계정" />
      <main className="page container">
        <div className="form-card">
          <h1 className="page-title heading-lg-mobile only-desktop">내 계정</h1>
          <Suspense fallback={<p className="caption">불러오는 중…</p>}><Account /></Suspense>
        </div>
      </main>
    </>
  );
}

async function Account() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  return (
    <div className="stack-6 mt-6">
      <dl className="gs-summary">
        <div className="gs-summary__row"><dt>이름</dt><dd>{user.name}</dd></div>
        <div className="gs-summary__row"><dt>이메일</dt><dd>{user.email}</dd></div>
        <div className="gs-summary__row"><dt>연락처</dt><dd>{formatPhone(user.phone)}</dd></div>
      </dl>
      <p className="caption text-sub m-0">회원 정보 수정·배송지 관리·주문 내역은 2차에 제공합니다.</p>
      {user.role === "ADMIN" ? <Button variant="dark" href="/admin/products" full>관리자 화면</Button> : null}
      <form action={logoutAction}><Button type="submit" variant="secondary" full>로그아웃</Button></form>
    </div>
  );
}
