// 관리자 상품·이미지·옵션·카테고리 관리(A-02–A-05, PRD 7.2·D-6·D-12·v1.7). 호출하는 쪽이 관리자 권한을 먼저 확인한다.
import { removeImage, saveImage } from "@/lib/storage";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { likeText } from "@/lib/catalog";

export class AdminError extends Error {
  constructor(public status: number, public code: string, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

/** 동시에 같은 이름으로 만들 때 고유 제약 충돌 → 409(QA2-07) */
const uniqueToConflict = (e: unknown) => (e && typeof e === "object" && "code" in e && e.code === "P2002" ? new AdminError(409, "NAME_TAKEN", "이미 있는 카테고리 이름입니다.") : e);

export const PAGE_SIZE = 20; // 관리자 상품 목록 20개씩(가정, PRD v1.7)

/* ---------------- 상품 목록(A-02) ---------------- */
export async function listAdminProducts(f: { categoryId?: string; status?: "ON_SALE" | "STOPPED"; q?: string; page?: number }) {
  const where = {
    ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.q ? { name: { contains: likeText(f.q), mode: "insensitive" as const } } : {}),
  };
  const total = await db.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(f.page ?? 1) || 1)); // 범위 밖 페이지는 끝 페이지로(QA2-03)
  const [onSale, stopped, rows] = await Promise.all([
    db.product.count({ where: { ...where, status: "ON_SALE" } }),
    db.product.count({ where: { ...where, status: "STOPPED" } }),
    db.product.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: {
        category: { select: { id: true, name: true, isSystem: true } },
        options: { select: { stock: true, isDefault: true } },
        images: { where: { kind: "MAIN" }, take: 1 },
        _count: { select: { orderItems: true } },
      },
    }),
  ]);
  return {
    total, onSale, stopped, page, pages,
    items: rows.map((p) => ({
      id: p.id, name: p.name, price: p.price, status: p.status, category: p.category, imageUrl: p.images[0]?.url ?? null,
      optionCount: p.options.length, defaultOnly: p.options.length === 1 && p.options[0].isDefault,
      totalStock: p.options.reduce((s, o) => s + o.stock, 0), hasOrders: p._count.orderItems > 0,
    })),
  };
}

export function getAdminProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] },
      options: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { orderItems: true } } } },
      category: true,
      _count: { select: { orderItems: true } },
    },
  });
}

/* ---------------- 상품 등록·수정(A-02·A-04) ---------------- */
const optionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "옵션명을 입력해 주세요.").max(100),
  extraPrice: z.coerce.number().int("추가금은 원 단위 정수로 입력해 주세요.").min(0, "추가금은 0원 이상이어야 합니다."),
  stock: z.coerce.number().int("재고는 정수로 입력해 주세요.").min(0, "재고는 0 이상이어야 합니다."),
});
export const productSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력해 주세요.").max(100),
  price: z.coerce.number().int("판매가는 원 단위 정수로 입력해 주세요.").min(0, "판매가는 0원 이상이어야 합니다."),
  description: z.string().max(5000).default(""),
  categoryId: z.string().min(1, "카테고리를 선택해 주세요."),
  status: z.enum(["ON_SALE", "STOPPED"]),
  options: z.array(optionSchema).default([]),
  /** 옵션이 없을 때 기본 옵션 재고(D-6) */
  defaultStock: z.coerce.number().int("재고는 정수로 입력해 주세요.").min(0, "재고는 0 이상이어야 합니다.").default(0),
});
export type ProductInput = z.infer<typeof productSchema>;

/** 저장. 옵션을 하나도 입력하지 않으면 기본 옵션 1개(D-6). 주문 이력이 있는 옵션은 지울 수 없다(v1.7) */
export async function saveProduct(id: string | null, input: ProductInput) {
  return db.$transaction(async (tx) => {
    const category = await tx.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AdminError(400, "INVALID_CATEGORY", "카테고리를 선택해 주세요.");
    const current = id ? await tx.product.findUnique({ where: { id }, include: { options: { include: { _count: { select: { orderItems: true } } } } } }) : null;
    if (id && !current) throw new AdminError(404, "NOT_FOUND", "상품을 찾을 수 없습니다.");
    // 미분류는 카테고리 삭제로만 지정된다. 새로 고르거나 다른 카테고리에서 옮길 수 없다(D-12)
    if (category.isSystem && current?.categoryId !== category.id) throw new AdminError(400, "SYSTEM_CATEGORY", "미분류는 선택할 수 없습니다. 다른 카테고리를 골라 주세요.");
    // 미분류 상품은 판매 중으로 바꿀 수 없다(가정, 7.2)
    if (category.isSystem && input.status === "ON_SALE") throw new AdminError(409, "UNCATEGORIZED_ON_SALE", "미분류 상품은 다른 카테고리로 먼저 바꿔야 판매 중으로 바꿀 수 있습니다.", { field: "categoryId" });

    const data = { name: input.name, price: input.price, description: input.description, categoryId: input.categoryId, status: input.status };
    const product = current ? await tx.product.update({ where: { id: current.id }, data }) : await tx.product.create({ data });

    const wanted = input.options.length ? input.options : [{ name: "기본", extraPrice: 0, stock: input.defaultStock, id: current?.options.find((o) => o.isDefault)?.id }];
    const isDefault = input.options.length === 0;
    const keep = new Set(wanted.map((o) => o.id).filter(Boolean));
    for (const old of current?.options ?? []) {
      if (keep.has(old.id)) continue;
      if (old._count.orderItems > 0) {
        throw new AdminError(409, "OPTION_HAS_ORDERS", `주문 이력이 있는 옵션(${old.name})은 삭제할 수 없습니다. 재고를 0으로 바꿔 품절로 정리해 주세요.`, { optionId: old.id });
      }
      await tx.productOption.delete({ where: { id: old.id } }); // 이 옵션을 담은 장바구니 항목도 함께 삭제(연쇄)
    }
    for (const [i, o] of wanted.entries()) {
      const fields = { name: o.name, extraPrice: o.extraPrice, stock: o.stock, sortOrder: i, isDefault };
      if (o.id && current?.options.some((x) => x.id === o.id)) await tx.productOption.update({ where: { id: o.id }, data: fields });
      else await tx.productOption.create({ data: { ...fields, productId: product.id } });
    }
    return product;
  });
}

/** 삭제(A-02): 주문 이력이 있으면 삭제하지 않고 판매 중지만 */
export async function deleteProduct(id: string) {
  const p = await db.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } }, images: true } });
  if (!p) throw new AdminError(404, "NOT_FOUND", "상품을 찾을 수 없습니다.");
  if (p._count.orderItems > 0) throw new AdminError(409, "HAS_ORDERS", "주문 이력이 있는 상품은 삭제할 수 없습니다. 판매 중지로 바꿔 주세요.");
  await db.product.delete({ where: { id } });
  await Promise.all(p.images.map((i) => removeUpload(i.url)));
}

/* ---------------- 이미지(A-03) ---------------- */
export const IMAGE_LIMIT = { count: 10, bytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] }; // 가정(PRD v1.6)
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function addImages(productId: string, files: File[]) {
  const count = await db.productImage.count({ where: { productId } });
  if (!files.length) throw new AdminError(400, "NO_FILE", "올릴 이미지를 골라 주세요.");
  if (count + files.length > IMAGE_LIMIT.count) throw new AdminError(400, "TOO_MANY", `이미지는 상품당 ${IMAGE_LIMIT.count}장까지 올릴 수 있습니다.`);
  for (const f of files) {
    if (!IMAGE_LIMIT.types.includes(f.type)) throw new AdminError(400, "BAD_TYPE", `이미지 업로드에 실패했습니다(${f.name}). jpg·png·webp 파일만 올릴 수 있습니다.`);
    if (f.size > IMAGE_LIMIT.bytes) throw new AdminError(400, "TOO_LARGE", `이미지 업로드에 실패했습니다(${f.name}). 한 장에 5MB 이하만 올릴 수 있습니다.`);
  }
  const buffers = await Promise.all(files.map(async (f) => Buffer.from(await f.arrayBuffer())));
  // 파일 내용으로 형식 확인(QA-09): 브라우저가 알려 주는 형식만 믿지 않는다
  for (const [i, buf] of buffers.entries()) {
    if (sniff(buf) !== files[i].type) throw new AdminError(400, "BAD_TYPE", `이미지 업로드에 실패했습니다(${files[i].name}). jpg·png·webp 파일만 올릴 수 있습니다.`);
  }
  const hasMain = (await db.productImage.count({ where: { productId, kind: "MAIN" } })) > 0;
  let order = count;
  for (const [i, f] of files.entries()) {
    const name = `${randomUUID()}.${EXT[f.type]}`;
    const url = await saveImage(name, buffers[i], f.type);
    await db.productImage.create({ data: { productId, url, kind: !hasMain && i === 0 ? "MAIN" : "DETAIL", sortOrder: order++ } });
  }
}

/** 파일 앞부분 바이트로 이미지 형식 판별 */
function sniff(b: Buffer): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/** 이미지 삭제. 대표를 지우면 첫 번째 상세 이미지가 대표가 된다(가정, PRD v1.7) */
export async function deleteImage(productId: string, imageId: string) {
  const img = await db.productImage.findFirst({ where: { id: imageId, productId } });
  if (!img) throw new AdminError(404, "NOT_FOUND", "이미지를 찾을 수 없습니다.");
  await db.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: img.id } });
    if (img.kind === "MAIN") {
      const next = await tx.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
      if (next) await tx.productImage.update({ where: { id: next.id }, data: { kind: "MAIN" } });
    }
  });
  await removeUpload(img.url);
}

const removeUpload = removeImage; // 로컬 uploads/ 또는 Vercel Blob

/* ---------------- 카테고리(A-05) ---------------- */
export async function listAdminCategories() {
  const cats = await db.category.findMany({ orderBy: [{ isSystem: "asc" }, { sortOrder: "asc" }], include: { products: { select: { status: true } } } });
  return cats.map((c) => ({
    id: c.id, name: c.name, isSystem: c.isSystem,
    onSale: c.products.filter((p) => p.status === "ON_SALE").length,
    stopped: c.products.filter((p) => p.status === "STOPPED").length,
  }));
}

const catName = z.string().trim().min(1, "카테고리 이름을 입력해 주세요.").max(50, "50자 이하로 입력해 주세요.");

/** 추가: 맨 뒤 순서(가정, PRD v1.7). 미분류는 항상 맨 뒤(정렬에서 시스템 항목을 마지막에) */
export async function createCategory(name: string) {
  const n = catName.safeParse(name);
  if (!n.success) throw new AdminError(400, "INVALID_INPUT", n.error.issues[0].message);
  if (await db.category.findUnique({ where: { name: n.data } })) throw new AdminError(409, "NAME_TAKEN", "이미 있는 카테고리 이름입니다.");
  const max = await db.category.aggregate({ where: { isSystem: false }, _max: { sortOrder: true } });
  return db.category.create({ data: { name: n.data, sortOrder: (max._max.sortOrder ?? 0) + 1 } }).catch((e) => { throw uniqueToConflict(e); });
}

export async function renameCategory(id: string, name: string) {
  const c = await db.category.findUnique({ where: { id } });
  if (!c) throw new AdminError(404, "NOT_FOUND", "카테고리를 찾을 수 없습니다.");
  if (c.isSystem) throw new AdminError(403, "SYSTEM_CATEGORY", "미분류는 수정·삭제할 수 없습니다.");
  const n = catName.safeParse(name);
  if (!n.success) throw new AdminError(400, "INVALID_INPUT", n.error.issues[0].message);
  const dup = await db.category.findUnique({ where: { name: n.data } });
  if (dup && dup.id !== id) throw new AdminError(409, "NAME_TAKEN", "이미 있는 카테고리 이름입니다.");
  return db.category.update({ where: { id }, data: { name: n.data } }).catch((e) => { throw uniqueToConflict(e); });
}

/**
 * 삭제(A-05, D-12) 한 트랜잭션: 판매 중 연결 상품이 있으면 거부(409 HAS_ON_SALE, N개) →
 * 판매 중지 상품이 남아 있으면 확인(confirm) 후 미분류로 이동 → 삭제. 미분류는 403.
 */
export async function deleteCategory(id: string, confirm: boolean) {
  return db.$transaction(async (tx) => {
    const c = await tx.category.findUnique({ where: { id } });
    if (!c) throw new AdminError(404, "NOT_FOUND", "카테고리를 찾을 수 없습니다.");
    if (c.isSystem) throw new AdminError(403, "SYSTEM_CATEGORY", "미분류는 수정·삭제할 수 없습니다.");
    const onSale = await tx.product.count({ where: { categoryId: id, status: "ON_SALE" } });
    if (onSale > 0) throw new AdminError(409, "HAS_ON_SALE", `판매 중 상품 ${onSale}개가 연결되어 있습니다. 상품의 카테고리를 변경하거나 판매 중지한 뒤 다시 삭제하세요.`, { onSale });
    const stopped = await tx.product.count({ where: { categoryId: id } });
    if (stopped > 0 && !confirm) throw new AdminError(409, "CONFIRM_REQUIRED", `연결된 판매 중지 상품 ${stopped}개가 미분류로 이동합니다.`, { stopped });
    if (stopped > 0) {
      const system = await tx.category.findFirstOrThrow({ where: { isSystem: true } });
      await tx.product.updateMany({ where: { categoryId: id }, data: { categoryId: system.id } });
    }
    await tx.category.delete({ where: { id } });
    return { moved: stopped };
  });
}
