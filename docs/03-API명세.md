# 굿즈샵 API 명세 (7단계)

> 원본은 Notion "굿즈 쇼핑몰 > 06. 기술 설계"(API는 "03. API 명세서", ERD 그림은 ERDCloud)다. 이 파일은 사본이며, 내용이 다르면 Notion을 따른다.


- 형식: JSON. 성공 `{ "data": ... }`, 실패 `{ "error": "CODE", "message": "..." }`.
- 인증: 쿠키 `gs_session`. 🔓 누구나 · 👤 회원 · 🛠 관리자. 권한이 없으면 401(로그인 필요)/403(관리자 아님).
- 상태: ✅ 7단계 구현 · ⬜ 8단계 구현 예정 · 2차 = PRD 적용 단계 2차.
- 기능 ID는 PRD v1.5 5장. 금액·재고는 항상 서버가 다시 계산·검증한다.

## 공통·탐색 (P)

| 상태 | 메서드 · 경로 | 권한 | 기능 | 요청 | 응답·오류 |
|---|---|---|---|---|---|
| ✅ | GET `/api/health` | 🔓 | 상태 확인 | — | `{ ok, products, categories }` |
| ✅ | GET `/api/categories` | 🔓 | P-02 | — | 카테고리(미분류 제외, 정렬 순) |
| ✅ | GET `/api/products` | 🔓 | P-02·P-03·P-04·P-05 | `category?`, `q?`, `sort=latest\|price_asc\|price_desc\|popular` | 판매 중 상품 `{id,name,price,imageUrl,soldOut}`. 400 `EMPTY_QUERY`("검색어를 입력해 주세요"), 400 `INVALID_QUERY` |
| ⬜ | GET `/api/products/{id}` | 🔓 | P-06·P-07 | — | 상세 + 옵션(재고·품절) + 이미지 + `status`. 판매 중지도 조회됨. 404 `NOT_FOUND` |
| ⬜ | GET `/api/home` | 🔓 | P-01 | — | 배너(고정 1–3, D-15)·신상품 8·인기 8(주문 건수, 취소 제외, D-3; 0건이면 최신순)·카테고리 |

## 회원 (U)

| 상태 | 메서드 · 경로 | 권한 | 기능 | 요청 | 응답·오류 |
|---|---|---|---|---|---|
| ⬜ | POST `/api/auth/signup` | 🔓 | U-01 | `email, password, passwordConfirm, name, phone` | 201. 400 필드 오류(`fields`), 409 `EMAIL_TAKEN` |
| ⬜ | POST `/api/auth/login` | 🔓 | U-02 | `email, password, intent?` | 쿠키 설정, `{ redirect }`(원래 행동 복귀). 401 `INVALID_CREDENTIALS` |
| ⬜ | POST `/api/auth/logout` | 👤 | U-02 | — | 세션 삭제 |
| ⬜ | GET `/api/me` | 👤 | U-02 | — | `{ id, name, email, role }` |
| ⬜ 2차 | PATCH `/api/me` | 👤 | U-03 | `name, phone` | — |
| ⬜ 2차 | GET·POST·PATCH·DELETE `/api/me/addresses` | 👤 | U-04 | 배송지 | 기본 1개 |
| ⬜ 2차 | GET `/api/me/orders`, `/api/me/orders/{id}` | 👤 | U-05 | — | 본인 주문만 |
| ⬜ 2차 | GET·POST·DELETE `/api/me/wishlist` | 👤 | U-06 | `productId` | — |

## 주문 (O)

| 상태 | 메서드 · 경로 | 권한 | 기능 | 요청 | 응답·오류 |
|---|---|---|---|---|---|
| ⬜ | GET `/api/cart` | 👤 | O-02 | — | 항목 + 구매 불가 사유(`OUT_OF_STOCK`·`SOLD_OUT`·`STOPPED`) + 예상 결제 금액(선택 항목) |
| ⬜ | POST `/api/cart` | 👤 | O-01 | `optionId, quantity` | 같은 옵션 합산(D-5). 409 `OVER_STOCK`(남은 수량), 409 `UNAVAILABLE` |
| ⬜ | PATCH `/api/cart/{itemId}` | 👤 | O-02 | `quantity` | 1 미만 → 1로, 재고 초과 → 409(7.3) |
| ⬜ | DELETE `/api/cart` | 👤 | O-02 | `itemIds[]` | 선택 삭제 |
| ⬜ | POST `/api/checkout` | 👤 | O-03·O-04 | `from: "cart"(itemIds) \| "buy"(optionId, quantity)` | 주문서 데이터 + `idempotencyKey` + 기본 배송지 미리 채움(D-8) |
| ⬜ | POST `/api/orders` | 👤 | O-04·O-05 | 주문자·배송지·요청사항·`paymentMethod`·`items`·`idempotencyKey`·`saveAsDefault?` | 201 `{ orderNumber }`(같은 키 재요청은 같은 주문). 400 필수값, 409 `OUT_OF_STOCK`(항목별 남은 수량), 409 `UNAVAILABLE`, 500 → 재시도 |
| ⬜ | GET `/api/orders/{orderNumber}` | 👤 | O-06 | — | 주문 완료 정보(본인만) |
| ⬜ 2차 | POST `/api/orders/{orderNumber}/cancel` | 👤 | O-07 | — | `PAID`에서만. 409 `NOT_CANCELABLE`. 재고 복구 |

## 관리자 (A) — 모두 🛠, 회원·비회원 403

| 상태 | 메서드 · 경로 | 기능 | 요청 | 응답·오류 |
|---|---|---|---|---|
| ⬜ | GET `/api/admin/products` | A-02 | `category?`(미분류 포함), `status?`, `q?`, `page?` | 목록 + 옵션 수·총 재고·주문 이력 여부 |
| ⬜ | POST `/api/admin/products` | A-02·A-04 | 상품 + `options[]`(없으면 기본 옵션) | 미분류 선택 불가 400 |
| ⬜ | PATCH `/api/admin/products/{id}` | A-02·A-04 | 부분 수정 | 미분류 상품 판매 중 전환 409, 재고 음수 400 |
| ⬜ | DELETE `/api/admin/products/{id}` | A-02 | — | 주문 이력 있으면 409 `HAS_ORDERS`(판매 중지만) |
| ⬜ | POST·DELETE `/api/admin/products/{id}/images` | A-03 | 파일(jpg/png/webp, 5MB, 최대 10장) | 업로드 실패 400/500, 입력값은 화면이 유지 |
| ⬜ | GET·POST `/api/admin/categories` | A-05 | `name` | 이름 중복 409 |
| ⬜ | PATCH·DELETE `/api/admin/categories/{id}` | A-05 | — | 판매 중 연결 409 `HAS_ON_SALE`(N개), 판매 중지만 남으면 `?confirm=true`로 미분류 이동 후 삭제, 미분류 403 |
| ⬜ 2차 | GET `/api/admin/orders`, `/{id}` | A-06 | 주문 번호·상태·기간 | — |
| ⬜ 2차 | PATCH `/api/admin/orders/{id}/status` | A-07 | `next` | 다음 단계 1개만, 취소 주문 409 |
| ⬜ 2차 | GET `/api/admin/summary` | A-08 | — | 주문 수·매출(취소 제외)·판매 중 상품 수 |

## 화면 라우트(8단계)
`/` 홈 · `/products?category=&sort=` 목록 · `/search?q=` · `/products/{id}` 상세 · `/cart` · `/checkout` 주문서 · `/orders/{orderNumber}/complete` · `/login?next=&intent=` · `/signup` · `/admin/products` · `/admin/categories`. 화면은 가능한 한 서버 컴포넌트에서 `lib/` 함수를 직접 호출하고, 폼 제출은 서버 액션 또는 위 API를 쓴다.
