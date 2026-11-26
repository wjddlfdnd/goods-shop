# goods-shop 작업 규칙

@AGENTS.md

- 요구사항 우선순위: PRD(Notion, docs에 요약) > 기능 명세서 > design/DESIGN.md > 시안. 코드가 문서와 다르면 문서를 먼저 확인한다.
- 문서에 없는 것을 정했거나(가정) 문서와 코드가 다르면(불일치) `docs/sync/LEDGER.md` 표 맨 아래에 한 줄(상태 `대기`)을 남긴다. 범위·정책·일정 변경은 사용자에게 확인한다.
- Next.js 16: `params`·`searchParams`·`cookies()`는 await, middleware 대신 `src/proxy.ts`, `cacheComponents` 사용 — 재고·주문·장바구니 같은 요청 시점 데이터는 `await connection()` + `<Suspense>`, 라우트 세그먼트 `dynamic` 설정은 쓰지 않는다.
- DB: 금액은 원 단위 정수, 연락처는 숫자만 저장, 재고는 `ProductOption.stock`만. 재고 차감은 조건부 갱신(`stock >= 수량`). 스키마 변경은 `npm run db:migrate`.
- 스타일: 색·간격·모서리·그림자는 `src/styles/tokens.css` 변수만. hex·px 직접 입력 금지.
- 디자인을 바꾸면 `npm run design:qa`(P0 = 0, P1 = 0).
- Git Flow: `main`(배포) ← `release-*` ← `develop` ← `feature-*`. 기능은 `develop`에서 `feature-<기능>` 브랜치를 만들고 PR로 `develop`에 병합(merge commit, `--no-ff`). 자세한 규칙은 docs/04-개발환경.md.
