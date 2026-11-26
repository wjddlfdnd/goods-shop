// 시드 상품 카탈로그(PRD 6장 테스트 데이터) — 개발 시드(seed.ts)와 배포 초기 데이터(bootstrap.ts)가 함께 쓴다.
// 이름·가격은 6단계 UI 시안 예시와 같다. 이미지는 public/images/products의 선 그림 SVG.
import type { PrismaClient } from "../src/generated/prisma/client";

type Opt = { name: string; stock: number; extraPrice?: number };
type Item = { name: string; price: number; icon: string; opts?: Opt[]; stock?: number; stopped?: boolean; daysAgo: number; description?: string };

const catalog: Record<string, Item[]> = {
  키링: [
    { name: "고양이 산책 아크릴 키링", price: 8900, icon: "keyring", daysAgo: 1, opts: [{ name: "크림 고양이", stock: 12 }, { name: "치즈 고양이", stock: 5 }, { name: "검은 고양이", stock: 0 }],
      description: "산책하는 고양이를 그린 투명 아크릴 키링입니다. 양면 인쇄에 은색 고리가 달려 있어 가방이나 열쇠에 바로 걸 수 있어요. 크기는 약 5 × 6cm입니다." },
    { name: "토끼 친구 아크릴 키링", price: 8900, icon: "keyring", daysAgo: 2, stock: 26 },
    { name: "구름 쿠션 말랑 키링", price: 9500, icon: "keyring", daysAgo: 9, stock: 14 },
    { name: "별자리 메탈 키링", price: 11000, icon: "keyring", daysAgo: 12, stock: 8 },
  ],
  스티커: [
    { name: "별빛 홀로그램 스티커 세트", price: 4500, icon: "sticker", daysAgo: 1, opts: [{ name: "홀로그램 실버", stock: 120 }, { name: "홀로그램 골드", stock: 0 }] },
    { name: "고양이 일상 씰 스티커", price: 3500, icon: "sticker", daysAgo: 5, stock: 200 },
    { name: "레트로 라벨 스티커 팩", price: 5000, icon: "sticker", daysAgo: 15, stock: 200 },
  ],
  포토카드: [
    { name: "곰돌이 포토카드 홀더", price: 7500, icon: "photocard", daysAgo: 2, stock: 34 },
    { name: "겨울 숲 포토카드 세트", price: 6500, icon: "photocard", daysAgo: 6, stock: 40 },
  ],
  엽서: [
    { name: "봄날 일러스트 엽서 5종", price: 6000, icon: "postcard", daysAgo: 3, opts: [{ name: "기본 구성", stock: 15 }] },
    { name: "도시 야경 엽서 세트", price: 5500, icon: "postcard", daysAgo: 20, stock: 0 },
  ],
  의류: [
    { name: "로고 자수 반팔 티셔츠", price: 29000, icon: "apparel", daysAgo: 4, opts: [{ name: "화이트 M", stock: 6 }, { name: "화이트 L", stock: 0 }, { name: "블랙 M", stock: 3 }, { name: "블랙 L", stock: 9 }] },
    { name: "오버핏 로고 맨투맨", price: 39000, icon: "apparel", daysAgo: 30, stock: 18, stopped: true },
  ],
  문구류: [
    { name: "데일리 플래너 노트", price: 12000, icon: "stationery", daysAgo: 7, stock: 40 },
    { name: "체크 패턴 메모패드", price: 3000, icon: "stationery", daysAgo: 25, stock: 50, stopped: true },
  ],
};

/** 카테고리 6개 + 미분류(시스템), 카테고리별 상품·옵션·이미지를 만든다. 빈 DB에서만 호출한다 */
export async function createCatalog(db: PrismaClient) {
  const names = Object.keys(catalog);
  for (const [i, name] of names.entries()) await db.category.create({ data: { name, sortOrder: i + 1 } });
  await db.category.create({ data: { name: "미분류", sortOrder: 99, isSystem: true } });

  const now = Date.now();
  for (const [catName, items] of Object.entries(catalog)) {
    const cat = await db.category.findUniqueOrThrow({ where: { name: catName } });
    for (const it of items) {
      const options = it.opts
        ? it.opts.map((o, i) => ({ name: o.name, stock: o.stock, extraPrice: o.extraPrice ?? 0, sortOrder: i }))
        : [{ name: "기본", stock: it.stock ?? 0, isDefault: true }]; // 옵션 없는 상품은 기본 옵션 1개(D-6)
      await db.product.create({
        data: {
          name: it.name, price: it.price, categoryId: cat.id, description: it.description ?? `${it.name}입니다.`,
          status: it.stopped ? "STOPPED" : "ON_SALE",
          createdAt: new Date(now - it.daysAgo * 86_400_000),
          options: { create: options },
          images: { create: [
            { kind: "MAIN", url: `/images/products/${it.icon}.svg` },
            { kind: "DETAIL", sortOrder: 1, url: `/images/products/${it.icon}.svg` },
          ] },
        },
      });
    }
  }
}
