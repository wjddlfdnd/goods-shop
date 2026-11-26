import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui";
import { AdminMenu } from "./AdminMenu";

// 관리자 화면 틀(A-01): 역할이 관리자가 아니면 홈으로 보내고 안내(PRD v1.3). 화면 숨김이 아니라 서버에서 확인한다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin">
      <Suspense fallback={<p className="caption container">권한 확인 중…</p>}>
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </div>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/?notice=admin-only");
  return (
    <>
      <header className="admin__header">
        <div className="admin__header-in container">
          <Link className="gs-logo logo-desktop" href="/admin/products">FANDOM PICK</Link>
          <span className="label text-ink" style={{ flex: 1 }}>ADMIN</span>
          <span className="body-sm-14 text-sub">{user.email} · 관리자</span>
          <form action={logoutAction}><Button type="submit" size="S">로그아웃</Button></form>
        </div>
      </header>
      <div className="admin__body container">
        <AdminMenu />
        <main>{children}</main>
      </div>
    </>
  );
}
