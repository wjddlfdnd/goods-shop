import { Button } from "@/components/ui";

// 관리자 화면에서 없는 상품·주문(QA2-02)
export default function AdminNotFound() {
  return (
    <div className="gs-panel"><div className="gs-empty">
      <h1 className="gs-empty__title">찾을 수 없습니다</h1>
      <p className="gs-empty__text">삭제되었거나 주소가 잘못된 항목입니다.</p>
      <div className="row" style={{ justifyContent: "center" }}><Button variant="dark" href="/admin/orders">주문 목록</Button><Button href="/admin/products">상품 목록</Button></div>
    </div></div>
  );
}
