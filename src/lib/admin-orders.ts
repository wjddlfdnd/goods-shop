// 관리자 주문 관리(A-06·A-07)와 판매 현황(A-08), 2차. 호출하는 쪽이 관리자 권한을 먼저 확인한다.
import { db } from "@/lib/db";
import { AdminError, PAGE_SIZE } from "@/lib/admin";
import { NEXT_STATUS, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { euro } from "@/lib/format";

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];
export const parseStatus = (v: unknown): OrderStatus | undefined => (STATUSES.includes(v as OrderStatus) ? (v as OrderStatus) : undefined);

/** 한국 날짜(YYYY-MM-DD) → 그날 0시(한국 시간)의 Date */
const kstStart = (d: string) => new Date(`${d}T00:00:00+09:00`);

/** 주문 목록(A-06): 주문 번호·주문 상태·기간(주문일, 한국 날짜 기준)으로 검색, 최신순, 20개씩 */
export async function listAdminOrders(f: { orderNumber?: string; status?: OrderStatus; from?: string; to?: string; page?: number }) {
  // 형식만 맞고 없는 날짜(2026-13-40)는 무시한다(QA2-01: Invalid Date로 500이 나던 문제)
  const valid = (d?: string) => {
    const m = d ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(d) : null;
    if (!m) return undefined;
    const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return dt.getUTCFullYear() === +m[1] && dt.getUTCMonth() === +m[2] - 1 && dt.getUTCDate() === +m[3] ? d : undefined;
  };
  const from = valid(f.from), to = valid(f.to);
  const where = {
    ...(f.orderNumber ? { orderNumber: { contains: f.orderNumber.trim() } } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: kstStart(from) } : {}), ...(to ? { lt: new Date(kstStart(to).getTime() + 86_400_000) } : {}) } } : {}),
  };
  const total = await db.order.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(f.page ?? 1) || 1)); // 범위 밖 페이지는 끝 페이지로(QA2-03)
  const rows = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { items: { select: { productName: true, quantity: true } } } });
  return {
    total, page, pages,
    items: rows.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, createdAt: o.createdAt, ordererName: o.ordererName, status: o.status, totalAmount: o.totalAmount,
      firstName: o.items[0]?.productName ?? "", itemCount: o.items.length, quantity: o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  };
}

/** 주문 상세(A-06·D-4): 주문 상품·주문자·배송지·결제 금액·상태 */
export function getAdminOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: { include: { option: { select: { isDefault: true } } } }, user: { select: { email: true } } } });
}

/**
 * 상태 변경(A-07): 다음 단계 1개로만. 건너뛰기·역방향·주문 취소 상태 변경·관리자의 취소 생성은 거부.
 * 화면에서 본 상태(from)일 때만 바꾸는 조건부 갱신이라, 그 사이 회원이 취소했거나 다른 관리자가 바꿨으면 409.
 */
export async function advanceOrderStatus(id: string, from: OrderStatus, next: OrderStatus) {
  if (NEXT_STATUS[from] !== next) {
    if (from === "CANCELED") throw new AdminError(409, "ORDER_CANCELED", "주문 취소 상태의 주문은 변경할 수 없습니다.");
    throw new AdminError(409, "INVALID_TRANSITION", NEXT_STATUS[from] ? `${STATUS_LABEL[from]}에서는 ${euro(STATUS_LABEL[NEXT_STATUS[from]!])}만 바꿀 수 있습니다.` : `${STATUS_LABEL[from]} 주문은 더 바꿀 수 없습니다.`);
  }
  const r = await db.order.updateMany({ where: { id, status: from }, data: { status: next } });
  if (r.count === 0) {
    const cur = await db.order.findUnique({ where: { id }, select: { status: true } });
    if (!cur) throw new AdminError(404, "NOT_FOUND", "주문을 찾을 수 없습니다.");
    throw new AdminError(409, cur.status === "CANCELED" ? "ORDER_CANCELED" : "STALE_STATUS", `그 사이 주문 상태가 '${euro(STATUS_LABEL[cur.status])}' 바뀌어 변경하지 않았습니다. 화면을 새로 확인해 주세요.`);
  }
  return { id, status: next };
}

/** 판매 현황 요약(A-08, 7.9): 총 주문 수·총매출은 주문 취소 제외, 판매 중 상품 수 */
export async function salesSummary() {
  const [orders, onSale] = await Promise.all([
    db.order.aggregate({ where: { status: { not: "CANCELED" } }, _count: true, _sum: { totalAmount: true } }),
    db.product.count({ where: { status: "ON_SALE" } }),
  ]);
  return { orderCount: orders._count, revenue: orders._sum.totalAmount ?? 0, onSaleProducts: onSale };
}
