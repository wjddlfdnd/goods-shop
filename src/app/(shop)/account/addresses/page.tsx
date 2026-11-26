import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { MobileSubHeader } from "@/components/layout/SiteHeader";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressActions } from "@/components/account/AddressActions";
import { Button, EmptyState, Label, Notice } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { ADDRESS_LIMIT, listAddresses } from "@/lib/account";
import { formatPhone } from "@/lib/format";

// 배송지 관리(U-04, 2차): 등록·수정·삭제·기본 지정(회원당 1개). 기본 배송지는 주문서에 미리 채워진다(D-8)
export default function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  return (
    <>
      <MobileSubHeader back="/account" title="배송지 관리" />
      <main className="page container">
        <div className="form-card" style={{ maxWidth: "calc(var(--grid-mobile-width) * 1.6)" }}>
          <h1 className="page-title heading-lg-mobile sr-only-mobile">배송지 관리</h1>
          <Suspense fallback={<p className="caption">불러오는 중…</p>}><Body searchParams={searchParams} /></Suspense>
        </div>
      </main>
    </>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<"/account/addresses">["searchParams"] }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/addresses");
  const [list, sp] = await Promise.all([listAddresses(user.id), searchParams]);
  const edit = typeof sp.edit === "string" ? sp.edit : null;
  const editing = edit && edit !== "new" ? list.find((a) => a.id === edit) : null;
  if (edit && edit !== "new" && !editing) notFound();
  return (
    <div className="stack-6 mt-6">
      {sp.saved ? <Notice live>배송지를 저장했습니다.</Notice> : null}
      {edit ? (
        <section className="panel-card stack-4" aria-label={editing ? "배송지 수정" : "배송지 추가"}>
          <h2 className="heading-xs m-0">{editing ? "배송지 수정" : "배송지 추가"}</h2>
          <AddressForm key={edit} first={list.length === 0} address={editing ?? { recipient: user.name, phone: user.phone, address1: "", address2: null, isDefault: false }} />
        </section>
      ) : list.length < ADDRESS_LIMIT ? (
        <Button variant="primary" icon="plus" href="/account/addresses?edit=new" full>배송지 추가</Button>
      ) : <p className="caption text-sub m-0">배송지는 {ADDRESS_LIMIT}개까지 저장할 수 있습니다.</p>}
      {list.length ? (
        <ul className="m-0 stack-4" style={{ padding: 0, listStyle: "none" }}>
          {list.map((a) => (
            <li key={a.id} className="panel-card stack-2">
              <div className="row" style={{ flexWrap: "wrap" }}>
                <b className="body-15 text-ink">{a.recipient}</b>
                {a.isDefault ? <Label kind="best">기본 배송지</Label> : null}
              </div>
              <span className="body-sm-14">{formatPhone(a.phone)}</span>
              <span className="body-sm-14">{a.address1}{a.address2 ? ` ${a.address2}` : ""}</span>
              <AddressActions id={a.id} label={`${a.recipient} 배송지`} isDefault={a.isDefault} />
            </li>
          ))}
        </ul>
      ) : !edit ? <EmptyState title="저장된 배송지가 없습니다" text="배송지를 추가하거나, 주문서에서 '기본 배송지로 저장'을 고르면 여기에 보입니다." /> : null}
    </div>
  );
}
