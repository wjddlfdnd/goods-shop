-- 굿즈샵 ERD — ERDCloud 가져오기용 DDL(MySQL 문법). 실제 DB는 PostgreSQL(prisma/schema.prisma가 원본).
-- 테이블·컬럼 COMMENT가 ERDCloud의 논리명으로 표시된다. 2026-11-26, PRD v1.6 6장 기준

CREATE TABLE `User` (
  `id` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `email` VARCHAR(255) NOT NULL COMMENT '이메일',
  `passwordHash` VARCHAR(100) NOT NULL COMMENT '비밀번호 해시(bcrypt)',
  `name` VARCHAR(50) NOT NULL COMMENT '이름',
  `phone` VARCHAR(11) NOT NULL COMMENT '연락처(숫자 10–11자리)',
  `role` VARCHAR(10) NOT NULL DEFAULT 'MEMBER' COMMENT '역할(MEMBER/ADMIN)',
  `createdAt` DATETIME NOT NULL COMMENT '가입일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_User_email` (`email`)
) COMMENT = '회원';

CREATE TABLE `Session` (
  `id` VARCHAR(64) NOT NULL COMMENT '세션 ID(토큰 SHA-256)',
  `userId` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `expiresAt` DATETIME NOT NULL COMMENT '만료일시',
  `createdAt` DATETIME NOT NULL COMMENT '생성일시',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_Session_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) COMMENT = '로그인 세션';

CREATE TABLE `Address` (
  `id` VARCHAR(30) NOT NULL COMMENT '배송지 ID',
  `userId` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `recipient` VARCHAR(50) NOT NULL COMMENT '받는 사람',
  `phone` VARCHAR(11) NOT NULL COMMENT '연락처',
  `address1` VARCHAR(255) NOT NULL COMMENT '주소',
  `address2` VARCHAR(255) NULL COMMENT '상세 주소',
  `isDefault` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 배송지 여부(회원당 1개)',
  `createdAt` DATETIME NOT NULL COMMENT '등록일시',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_Address_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) COMMENT = '배송지';

CREATE TABLE `Category` (
  `id` VARCHAR(30) NOT NULL COMMENT '카테고리 ID',
  `name` VARCHAR(50) NOT NULL COMMENT '이름',
  `sortOrder` INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  `isSystem` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '시스템 카테고리 여부(미분류)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_Category_name` (`name`)
) COMMENT = '카테고리';

CREATE TABLE `Product` (
  `id` VARCHAR(30) NOT NULL COMMENT '상품 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '상품명',
  `price` INT NOT NULL COMMENT '판매가(원, 0 이상)',
  `description` TEXT NOT NULL COMMENT '설명',
  `status` VARCHAR(10) NOT NULL DEFAULT 'ON_SALE' COMMENT '판매 상태(ON_SALE/STOPPED)',
  `categoryId` VARCHAR(30) NOT NULL COMMENT '카테고리 ID',
  `createdAt` DATETIME NOT NULL COMMENT '등록일(최신순 기준)',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_Product_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`)
) COMMENT = '상품';

CREATE TABLE `ProductOption` (
  `id` VARCHAR(30) NOT NULL COMMENT '옵션 ID',
  `productId` VARCHAR(30) NOT NULL COMMENT '상품 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '옵션명',
  `extraPrice` INT NOT NULL DEFAULT 0 COMMENT '추가금(원)',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '재고(0 이상)',
  `isDefault` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 옵션 여부(D-6)',
  `sortOrder` INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ProductOption_productId` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`)
) COMMENT = '상품 옵션';

CREATE TABLE `ProductImage` (
  `id` VARCHAR(30) NOT NULL COMMENT '이미지 ID',
  `productId` VARCHAR(30) NOT NULL COMMENT '상품 ID',
  `kind` VARCHAR(10) NOT NULL COMMENT '구분(MAIN 대표/DETAIL 상세)',
  `sortOrder` INT NOT NULL DEFAULT 0 COMMENT '순서',
  `url` VARCHAR(500) NOT NULL COMMENT '이미지 URL',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_ProductImage_productId` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`)
) COMMENT = '상품 이미지';

CREATE TABLE `CartItem` (
  `id` VARCHAR(30) NOT NULL COMMENT '장바구니 항목 ID',
  `userId` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `optionId` VARCHAR(30) NOT NULL COMMENT '옵션 ID',
  `quantity` INT NOT NULL COMMENT '수량(1 이상)',
  `createdAt` DATETIME NOT NULL COMMENT '담은 일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_CartItem_user_option` (`userId`, `optionId`),
  CONSTRAINT `FK_CartItem_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`),
  CONSTRAINT `FK_CartItem_optionId` FOREIGN KEY (`optionId`) REFERENCES `ProductOption` (`id`)
) COMMENT = '장바구니';

CREATE TABLE `Order` (
  `id` VARCHAR(30) NOT NULL COMMENT '주문 ID',
  `orderNumber` VARCHAR(20) NOT NULL COMMENT '주문 번호(YYYYMMDD-6자리)',
  `userId` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `status` VARCHAR(10) NOT NULL DEFAULT 'PAID' COMMENT '주문 상태',
  `ordererName` VARCHAR(50) NOT NULL COMMENT '주문자 이름',
  `ordererPhone` VARCHAR(11) NOT NULL COMMENT '주문자 연락처',
  `recipient` VARCHAR(50) NOT NULL COMMENT '받는 사람',
  `recipientPhone` VARCHAR(11) NOT NULL COMMENT '받는 사람 연락처',
  `address1` VARCHAR(255) NOT NULL COMMENT '주소',
  `address2` VARCHAR(255) NULL COMMENT '상세 주소',
  `requestNote` VARCHAR(255) NULL COMMENT '배송 요청사항',
  `paymentMethod` VARCHAR(10) NOT NULL COMMENT '결제 수단(CARD/TRANSFER/EASY_PAY)',
  `totalAmount` INT NOT NULL COMMENT '결제 금액(원)',
  `idempotencyKey` VARCHAR(36) NOT NULL COMMENT '주문 요청 키(중복 주문 방지)',
  `createdAt` DATETIME NOT NULL COMMENT '주문일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_Order_orderNumber` (`orderNumber`),
  UNIQUE KEY `UK_Order_idempotencyKey` (`idempotencyKey`),
  CONSTRAINT `FK_Order_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) COMMENT = '주문';

CREATE TABLE `OrderItem` (
  `id` VARCHAR(30) NOT NULL COMMENT '주문 상품 ID',
  `orderId` VARCHAR(30) NOT NULL COMMENT '주문 ID',
  `productId` VARCHAR(30) NOT NULL COMMENT '상품 ID',
  `optionId` VARCHAR(30) NOT NULL COMMENT '옵션 ID',
  `productName` VARCHAR(100) NOT NULL COMMENT '상품명(주문 시점)',
  `optionName` VARCHAR(100) NOT NULL COMMENT '옵션명(주문 시점)',
  `unitPrice` INT NOT NULL COMMENT '단가(판매가+추가금)',
  `quantity` INT NOT NULL COMMENT '수량',
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_OrderItem_orderId` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`),
  CONSTRAINT `FK_OrderItem_productId` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`),
  CONSTRAINT `FK_OrderItem_optionId` FOREIGN KEY (`optionId`) REFERENCES `ProductOption` (`id`)
) COMMENT = '주문 상품';

CREATE TABLE `Wishlist` (
  `userId` VARCHAR(30) NOT NULL COMMENT '회원 ID',
  `productId` VARCHAR(30) NOT NULL COMMENT '상품 ID',
  `createdAt` DATETIME NOT NULL COMMENT '찜한 일시',
  PRIMARY KEY (`userId`, `productId`),
  CONSTRAINT `FK_Wishlist_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`),
  CONSTRAINT `FK_Wishlist_productId` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`)
) COMMENT = '찜(2차)';
