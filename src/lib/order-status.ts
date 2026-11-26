// 주문 상태(PRD 7.8): 결제 완료 → 배송 준비 → 배송 중 → 배송 완료, 결제 완료에서만 회원 취소
export type OrderStatus = "PAID" | "PREPARING" | "SHIPPING" | "DELIVERED" | "CANCELED";
export const STATUS_LABEL: Record<OrderStatus, string> = { PAID: "결제 완료", PREPARING: "배송 준비", SHIPPING: "배송 중", DELIVERED: "배송 완료", CANCELED: "주문 취소" };
/** 관리자가 바꿀 수 있는 다음 단계 1개(A-07). 취소·배송 완료는 다음 단계 없음 */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = { PAID: "PREPARING", PREPARING: "SHIPPING", SHIPPING: "DELIVERED" };
export const PAY_LABEL = { CARD: "카드", TRANSFER: "계좌이체", EASY_PAY: "간편결제" } as const;
