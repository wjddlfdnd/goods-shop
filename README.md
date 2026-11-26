# GOODS SHOP (굿즈샵)

키링·스티커·포토카드·엽서·의류·문구류를 파는 연습용 굿즈 쇼핑몰. 실제 결제 대신 모의 결제로 주문 흐름을 끝까지 구현한다.

- 스택: Next.js 16 (App Router) · TypeScript · PostgreSQL 16 · Prisma 7
- 요구사항: PRD v1.5(Notion) — 기능 ID U·P·O·A
- 진행: 10단계 중 7단계(기술 설계·환경 구성) 완료, 8단계(개발) 예정

## 빠른 시작
```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:setup
npm run dev
```
자세한 내용: [docs/04-개발환경.md](docs/04-개발환경.md)

## 문서
| 문서 | 내용 |
|---|---|
| [docs/01-기술설계서.md](docs/01-기술설계서.md) | 스택, 구조, 인증·권한, 결제 트랜잭션, 규칙 위치, 배포(가정) |
| [docs/02-ERD.md](docs/02-ERD.md) | 데이터 모델(mermaid), 규칙 ↔ 데이터 |
| [docs/03-API명세.md](docs/03-API명세.md) | API 목록과 구현 상태 |
| [docs/04-개발환경.md](docs/04-개발환경.md) | 실행, 스크립트, 개발용 계정, Git 규칙 |
| [design/DESIGN.md](design/DESIGN.md) | 디자인 언어 v2(7원칙, 토큰, 컴포넌트, 그리드) |
| [docs/sync/LEDGER.md](docs/sync/LEDGER.md) | 기획 문서 동기화 장부(결정·가정·불일치 기록) |

## 디자인
- UI 시안(6단계): `design/hifi/` (디자인 캔버스 원본) · 와이어프레임(5단계): `design/wireframe/`
- 디자인 시스템 v2.3: 토큰·컴포넌트 CSS는 `src/styles/`, 컴포넌트는 8단계에서 `src/components/`로 이식
- 디자인 QA: `npm run design:qa` (`design/qa/`, Playwright 필요)
