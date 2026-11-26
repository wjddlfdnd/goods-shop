import { Suspense } from "react";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "@/components/forms/LoginForm";
import { Notice } from "@/components/ui";
import { parseIntent } from "@/lib/intent";

// 로그인(U-02). next·intent로 원래 행동을 이어 간다(PRD 4.2 시나리오 1)
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <MobileSubHeader back="/" cart={false} />
      <main className="page container">
        <div className="form-card">
          <h1 className="page-title heading-lg-mobile">로그인</h1>
          <Suspense fallback={null}><LoginBody searchParams={searchParams} /></Suspense>
        </div>
      </main>
    </>
  );
}

async function LoginBody({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const intent = typeof sp.intent === "string" ? sp.intent : undefined;
  const parsed = parseIntent(intent);
  return (
    <div className="stack-6">
      <p className="body-15 text-sub m-0">이메일로 로그인하세요</p>
      {sp.joined ? <Notice live>가입이 완료되었습니다. 가입한 이메일로 로그인해 주세요.</Notice> : null}
      {parsed ? <Notice>로그인하면 하려던 {parsed.type === "cart" ? "장바구니 담기" : "바로 구매"}를 이어서 진행합니다.</Notice> : null}
      <LoginForm next={next} intent={intent} />
    </div>
  );
}
