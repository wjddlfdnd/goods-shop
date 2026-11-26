// 주문서·모의 결제·주문 완료(O-03–O-06, PRD 6장 트랜잭션, 기술 설계서 4.1).
import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { digitsOnly } from "@/lib/validation";

export type CheckoutSource = { from: "cart"; itemIds: string[] } | { from: "buy"; optionId: string; quantity: number };
export type CheckoutLine = {
  optionId: string; productId: string; productName: string; optionName: string; isDefaultOption: boolean; imageUrl: string | null;
  unitPrice: number; quantity: number; stock: number; cartItemId?: string;
  problem: null | { code: "UNAVAILABLE" | "OUT_OF_STOCK"; message: string; remaining?: number };
};

export class OrderError extends Error {
  constructor(public code: "EMPTY" | "UNAVAILABLE" | "OUT_OF_STOCK" | "INVALID_INPUT", message: string, public items?: { optionId: string; remaining: number }[]) {
    super(message);
  }
}

const optionInclude = { product: { include: { images: { where: { kind: "MAIN" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 } } } };

function toLine(o: Prisma.ProductOptionGetPayload<{ include: typeof optionInclude }>, quantity: number, cartItemId?: string): CheckoutLine {
  const p = o.product;
  const problem: CheckoutLine["problem"] =
    p.status !== "ON_SALE" ? { code: "UNAVAILABLE", message: "판매가 중지된 상품입니다." }
    : quantity > o.stock ? { code: "OUT_OF_STOCK", message: o.stock === 0 ? "품절" : `재고 부족 · 남은 수량 ${o.stock}개`, remaining: o.stock }
    : null;
  return {
    optionId: o.id, productId: p.id, productName: p.name, optionName: o.name, isDefaultOption: o.isDefault, imageUrl: p.images[0]?.url ?? null,
    unitPrice: p.price + o.extraPrice, quantity, stock: o.stock, cartItemId, problem,
  };
}

type Client = Prisma.TransactionClient | typeof db;

async function loadLines(client: Client, userId: string, source: CheckoutSource): Promise<CheckoutLine[]> {
  if (source.from === "buy") {
    if (!Number.isInteger(source.quantity) || source.quantity < 1) return [];
    const o = await client.productOption.findUnique({ where: { id: source.optionId }, include: optionInclude });
    return o ? [toLine(o, source.quantity)] : [];
  }
  const items = await client.cartItem.findMany({ where: { userId, id: { in: source.itemIds } }, orderBy: { createdAt: "desc" }, include: { option: { include: optionInclude } } });
  return items.map((it) => toLine(it.option, it.quantity, it.id));
}

/** 주문서에 올릴 항목(O-03·O-04): 장바구니 선택 항목(본인 것만) 또는 바로 구매 옵션·수량 */
export const checkoutLines = (userId: string, source: CheckoutSource) => loadLines(db, userId, source);

export function parseSource(sp: { items?: unknown; buy?: unknown }): CheckoutSource | null {
  if (typeof sp.buy === "string") {
    const [optionId, q] = sp.buy.split(":");
    return optionId ? { from: "buy", optionId, quantity: Number(q) } : null;
  }
  if (typeof sp.items === "string" && sp.items) return { from: "cart", itemIds: sp.items.split(",").filter(Boolean) };
  return null;
}

/** 주문서 미리 채우기(O-04): 주문자 = 회원 정보(가정), 배송지 = 기본 배송지(D-8) */
export async function checkoutPrefill(userId: string) {
  const [user, address] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, phone: true } }),
    db.address.findFirst({ where: { userId, isDefault: true } }),
  ]);
  return { orderer: user, address };
}

export type PlaceOrderInput = {
  idempotencyKey: string; source: CheckoutSource; paymentMethod: "CARD" | "TRANSFER" | "EASY_PAY";
  ordererName: string; ordererPhone: string; recipient: string; recipientPhone: string; address1: string; address2?: string; requestNote?: string;
  saveAsDefault?: boolean;
};

/** 주문 번호(D-7): YYYYMMDD(한국 시간)-6자리 난수 */
export function newOrderNumber(now = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now).replaceAll("-", "");
  return `${ymd}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

/**
 * 모의 결제(O-05). 하나의 트랜잭션: 같은 키 주문 확인 → 판매 중지 확인 → 재고 조건부 차감(stock >= 수량)
 * → 주문 번호 발급 → 주문·주문 상품 생성(시점 복사) → 장바구니 경유면 주문한 항목 삭제 → 기본 배송지 저장.
 * 하나라도 실패하면 전체 롤백. 금액은 서버가 다시 계산한다(7.4).
 */
export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<{ orderNumber: string; duplicate: boolean }> {
  const dup = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { orderNumber: true, userId: true } });
  if (dup) {
    if (dup.userId !== userId) throw new OrderError("INVALID_INPUT", "주문 요청이 올바르지 않습니다.");
    return { orderNumber: dup.orderNumber, duplicate: true };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const lines = await loadLines(tx, userId, input.source);
        if (!lines.length) throw new OrderError("EMPTY", "주문할 상품이 없습니다.");
        if (lines.some((l) => l.problem?.code === "UNAVAILABLE")) throw new OrderError("UNAVAILABLE", "판매가 중지된 상품이 있어 주문하지 못했습니다.");

        const short: { optionId: string; remaining: number }[] = [];
        for (const l of lines) {
          // 조건부 차감: 갱신 0행이면 재고 부족(동시 결제에서도 0 미만 불가, CHECK 제약이 이중 안전장치)
          const n = await tx.$executeRaw`UPDATE "ProductOption" SET stock = stock - ${l.quantity} WHERE id = ${l.optionId} AND stock >= ${l.quantity}`;
          if (n === 0) {
            const cur = await tx.productOption.findUnique({ where: { id: l.optionId }, select: { stock: true } });
            short.push({ optionId: l.optionId, remaining: cur?.stock ?? 0 });
          }
        }
        if (short.length) throw new OrderError("OUT_OF_STOCK", "재고가 부족해 주문하지 못했습니다.", short);

        const totalAmount = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
        const order = await tx.order.create({
          data: {
            orderNumber: newOrderNumber(), userId, idempotencyKey: input.idempotencyKey, paymentMethod: input.paymentMethod, totalAmount,
            ordererName: input.ordererName, ordererPhone: digitsOnly(input.ordererPhone), recipient: input.recipient, recipientPhone: digitsOnly(input.recipientPhone),
            address1: input.address1, address2: input.address2 || null, requestNote: input.requestNote || null,
            items: { create: lines.map((l) => ({ productId: l.productId, optionId: l.optionId, productName: l.productName, optionName: l.optionName, unitPrice: l.unitPrice, quantity: l.quantity })) },
          },
        });
        if (input.source.from === "cart") await tx.cartItem.deleteMany({ where: { userId, id: { in: lines.map((l) => l.cartItemId!).filter(Boolean) } } });
        if (input.saveAsDefault && !(await tx.address.findFirst({ where: { userId, isDefault: true } }))) {
          await tx.address.create({ data: { userId, recipient: input.recipient, phone: digitsOnly(input.recipientPhone), address1: input.address1, address2: input.address2 || null, isDefault: true } });
        }
        return { orderNumber: order.orderNumber, duplicate: false };
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        // 고유 제약 충돌: 같은 키로 동시에 들어온 요청이면 먼저 만든 주문을 돌려주고, 아니면 주문 번호 충돌이라 재발급(최대 3회)
        const first = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { orderNumber: true, userId: true } });
        if (first) {
          if (first.userId !== userId) throw new OrderError("INVALID_INPUT", "주문 요청이 올바르지 않습니다.");
          return { orderNumber: first.orderNumber, duplicate: true };
        }
        continue;
      }
      throw e;
    }
  }
  throw new Error("주문 번호를 만들지 못했습니다.");
}

/** 주문 완료(O-06): 본인 주문만 */
export function getOrder(userId: string, orderNumber: string) {
  return db.order.findFirst({ where: { orderNumber, userId }, include: { items: { include: { option: { select: { isDefault: true } } } } } });
}
