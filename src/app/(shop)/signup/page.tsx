import { Suspense } from "react";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { SignupForm } from "@/components/forms/SignupForm";

// 회원가입(U-01)
export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <>
      <MobileSubHeader back="/login" cart={false} />
      <main className="page container">
        <div className="form-card">
          <h1 className="page-title heading-lg-mobile">회원가입</h1>
          <p className="body-15 text-sub" style={{ marginTop: 0 }}>이메일로 가입하고 바로 쇼핑을 시작하세요</p>
          <Suspense fallback={null}><Body searchParams={searchParams} /></Suspense>
        </div>
      </main>
    </>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const sp = await searchParams;
  return <SignupForm next={typeof sp.next === "string" ? sp.next : undefined} />;
}
