import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { formatPhone } from "@/lib/format";

// 마이페이지(2차): 회원 요약 + 메뉴 + 로그아웃(U-02)
export default function AccountPage() {
  return (
    <>
      <MobileSubHeader back="/" title="마이페이지" />
      <main className="page container">
        <div className="form-card">
          <h1 className="page-title heading-lg-mobile sr-only-mobile">마이페이지</h1>
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
      <section className="gs-surface stack-2" aria-label="회원 정보">
        <b className="heading-xs text-ink">{user.name}님</b>
        <span className="body-sm-14 text-sub">{user.email} · {formatPhone(user.phone)}</span>
      </section>
      <AccountNav />
      {user.role === "ADMIN" ? <Button variant="dark" href="/admin/products" full>관리자 화면</Button> : null}
      <form action={logoutAction}><Button type="submit" variant="secondary" full>로그아웃</Button></form>
    </div>
  );
}
