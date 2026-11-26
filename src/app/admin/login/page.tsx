import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminLoginForm } from "./AdminLoginForm";

// 관리자 전용 로그인(A-01 2차). 관리자 계정만 들어갈 수 있다. 회원·비회원의 관리자 화면 접근은 계속 홈 안내(v1.3)
export default function AdminLoginPage() {
  return (
    <main className="admin" style={{ placeItems: "center", padding: "var(--space-8) var(--grid-mobile-margin)" }}>
      <div className="panel-card stack-6" style={{ width: "100%", maxWidth: "calc(var(--grid-mobile-width) + var(--space-8))" }}>
        <div className="stack-2">
          <span className="row"><span className="gs-logo logo-desktop">FANDOM PICK</span><span className="label text-ink">ADMIN</span></span>
          <h1 className="heading-sm-mobile m-0">관리자 로그인</h1>
          <p className="body-sm-14 text-sub m-0">관리자 계정으로만 로그인할 수 있습니다.</p>
        </div>
        <Suspense fallback={<AdminLoginForm />}><AlreadyAdmin /></Suspense>
        <Link href="/login" className="gs-link body-sm-14"><span>쇼핑몰 로그인으로 →</span></Link>
      </div>
    </main>
  );
}

// 이미 로그인한 관리자는 대시보드로(QA2-05)
async function AlreadyAdmin() {
  if (await requireAdmin()) redirect("/admin/dashboard");
  return <AdminLoginForm />;
}
