import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { ProfileForm } from "@/components/account/ProfileForm";
import { getSessionUser } from "@/lib/auth";

// 회원 정보 수정(U-03, 2차)
export default function ProfilePage() {
  return (
    <>
      <MobileSubHeader back="/account" title="내 정보 수정" />
      <main className="page container">
        <div className="form-card">
          <h1 className="page-title heading-lg-mobile sr-only-mobile">내 정보 수정</h1>
          <Suspense fallback={<p className="caption">불러오는 중…</p>}><Body /></Suspense>
        </div>
      </main>
    </>
  );
}

async function Body() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/profile");
  return <div className="mt-6"><ProfileForm key={user.id} email={user.email} name={user.name} phone={user.phone} /></div>;
}
