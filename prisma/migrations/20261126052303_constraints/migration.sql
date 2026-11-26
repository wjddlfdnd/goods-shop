-- PRD 7.2·7.3·6장: 데이터베이스 수준 규칙
-- 재고·수량·금액은 음수 불가
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_stock_nonneg" CHECK ("stock" >= 0);
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_extraPrice_nonneg" CHECK ("extraPrice" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_nonneg" CHECK ("price" >= 0);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_pos" CHECK ("quantity" >= 1);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_pos" CHECK ("quantity" >= 1);
-- 연락처는 숫자 10–11자리(PRD v1.4)
ALTER TABLE "User" ADD CONSTRAINT "User_phone_digits" CHECK ("phone" ~ '^[0-9]{10,11}$');
ALTER TABLE "Address" ADD CONSTRAINT "Address_phone_digits" CHECK ("phone" ~ '^[0-9]{10,11}$');
ALTER TABLE "Order" ADD CONSTRAINT "Order_phones_digits" CHECK ("ordererPhone" ~ '^[0-9]{10,11}$' AND "recipientPhone" ~ '^[0-9]{10,11}$');
-- 기본 배송지는 회원당 1개(U-04)
CREATE UNIQUE INDEX "Address_one_default_per_user" ON "Address" ("userId") WHERE "isDefault";
-- 시스템 카테고리(미분류)는 1개(D-12)
CREATE UNIQUE INDEX "Category_one_system" ON "Category" ("isSystem") WHERE "isSystem";
