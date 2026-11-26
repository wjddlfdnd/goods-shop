import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FANDOM PICK 팬덤픽",
  description: "팬덤픽 — 팬덤이 직접 고른 추천템. 연습용 굿즈 쇼핑몰(모의 결제)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* 디자인 시스템 글꼴. 불러오지 못하면 tokens.css의 대체 글꼴을 쓴다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="gs-root">{children}</body>
    </html>
  );
}
