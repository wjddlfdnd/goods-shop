// 7단계 완료 기준 확인: 서버가 떠 있는 상태에서 기본 데이터가 조회되는지 본다.
const base = process.env.BASE_URL ?? "http://localhost:3000";
const fail = (m) => { console.error("✗", m); process.exitCode = 1; };
const get = async (path) => { const r = await fetch(base + path); return { status: r.status, body: await r.json() }; };

const health = await get("/api/health");
health.body.ok ? console.log("✓ health", health.body) : fail("health");
const cats = await get("/api/categories");
cats.body.data?.length === 6 && !cats.body.data.some((c) => c.name === "미분류") ? console.log("✓ 카테고리 6개(미분류 제외)") : fail(`카테고리 ${JSON.stringify(cats.body)}`);
const products = await get("/api/products");
products.body.data?.length > 0 ? console.log(`✓ 판매 중 상품 ${products.body.data.length}개`) : fail("상품 없음");
const blank = await get("/api/products?q=%20");
blank.status === 400 && blank.body.error === "EMPTY_QUERY" ? console.log("✓ 빈 검색어 400") : fail("빈 검색어 처리");
const q = await get("/api/products?q=" + encodeURIComponent("스티커"));
q.body.data?.every((p) => p.name.includes("스티커")) ? console.log(`✓ 검색 '스티커' ${q.body.data.length}개`) : fail("검색");
