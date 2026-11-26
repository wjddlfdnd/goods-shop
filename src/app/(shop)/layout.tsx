import { DesktopHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

// 사용자 화면 공통 틀: 데스크톱 헤더(모바일 헤더는 화면마다 홈형·하위 화면형이 달라 각 페이지가 그린다) + 푸터
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader />
      {children}
      <SiteFooter />
    </>
  );
}
