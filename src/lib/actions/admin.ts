"use server";
// 관리자 서버 액션(A-02–A-05). 매번 서버에서 관리자 역할을 다시 확인한다(화면 숨김만으로 권한 처리 금지, PRD 6장).
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { authenticate, requireAdmin, startSession } from "@/lib/auth";
import { advanceOrderStatus, parseStatus } from "@/lib/admin-orders";
import { AdminError, addImages, createCategory, deleteCategory, deleteImage, deleteProduct, productSchema, renameCategory, saveProduct } from "@/lib/admin";
import { fieldErrors, type FieldErrors } from "@/lib/validation";

export type AdminState = { errors?: FieldErrors; message?: string; ok?: string; confirm?: { id: string; stopped: number }; blocked?: { id: string; message: string } } | undefined;

async function guard() {
  if (!(await requireAdmin())) redirect("/?notice=admin-only");
}

const fail = (e: unknown): AdminState => {
  if (e instanceof AdminError) {
    const field = typeof e.extra?.field === "string" ? e.extra.field : undefined;
    return field ? { errors: { [field]: e.message }, message: e.message } : { message: e.message };
  }
  throw e;
};

/** 상품 저장(등록·수정). 옵션은 opt-<i>-id/name/extraPrice/stock 필드로 온다 */
export async function saveProductAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  await guard();
  const id = String(form.get("id") ?? "") || null;
  const rows = new Map<number, Record<string, string>>();
  for (const [k, v] of form.entries()) {
    const m = /^opt-(\d+)-(id|name|extraPrice|stock)$/.exec(k);
    if (m) rows.set(Number(m[1]), { ...rows.get(Number(m[1])), [m[2]]: String(v) });
  }
  const options = [...rows.entries()].sort(([a], [b]) => a - b).map(([, r]) => ({ ...r, id: r.id || undefined }));
  const parsed = productSchema.safeParse({
    name: form.get("name"), price: form.get("price"), description: form.get("description") ?? "", categoryId: form.get("categoryId"), status: form.get("status"), options, defaultStock: form.get("defaultStock") ?? 0,
  });
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const i of parsed.error.issues) {
      const key = i.path[0] === "options" ? `opt-${String(i.path[1])}-${String(i.path[2])}` : String(i.path[0]);
      errors[key] ??= i.path[0] === "options" ? `옵션 ${Number(i.path[1]) + 1}: ${i.message}` : i.message;
    }
    return { errors, message: `입력값 ${Object.keys(errors).length}개를 확인해 주세요. 고친 뒤 저장할 수 있습니다.` };
  }
  let savedId: string;
  try {
    savedId = (await saveProduct(id, parsed.data)).id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/admin/products?edit=${savedId}&saved=1`);
}

export async function deleteProductAction(id: string): Promise<AdminState> {
  await guard();
  try { await deleteProduct(id); } catch (e) { return fail(e); }
  redirect("/admin/products?deleted=1");
}

export async function uploadImagesAction(productId: string, _prev: AdminState, form: FormData): Promise<AdminState> {
  await guard();
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  try { await addImages(productId, files); } catch (e) {
    if (e instanceof AdminError) return { message: `${e.message} 입력한 상품 정보는 그대로 있으니 파일을 다시 올려 주세요.` };
    console.error(e);
    return { message: "이미지 업로드에 실패했습니다. 입력한 상품 정보는 그대로 있으니 파일을 다시 올려 주세요." };
  }
  refresh();
  return { ok: `이미지 ${files.length}장을 올렸습니다.` };
}

export async function deleteImageAction(productId: string, imageId: string): Promise<AdminState> {
  await guard();
  try { await deleteImage(productId, imageId); } catch (e) { return fail(e); }
  refresh();
  return undefined;
}

export async function createCategoryAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  await guard();
  try { await createCategory(String(form.get("name") ?? "")); } catch (e) { return fail(e); }
  redirect("/admin/categories?done=added");
}

export async function renameCategoryAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  await guard();
  try { await renameCategory(String(form.get("id")), String(form.get("name") ?? "")); } catch (e) { return fail(e); }
  redirect("/admin/categories");
}

export async function deleteCategoryAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  await guard();
  const id = String(form.get("id"));
  let moved: number;
  try {
    ({ moved } = await deleteCategory(id, form.get("confirm") === "true"));
  } catch (e) {
    if (e instanceof AdminError && e.code === "CONFIRM_REQUIRED") return { confirm: { id, stopped: Number(e.extra?.stopped) } };
    if (e instanceof AdminError && e.code === "HAS_ON_SALE") return { blocked: { id, message: e.message } };
    return fail(e);
  }
  redirect(`/admin/categories?done=deleted&moved=${moved}`);
}

/** 주문 상태 변경(A-07, 2차) */
export async function advanceOrderStatusAction(id: string, from: string, next: string): Promise<AdminState> {
  await guard();
  const f = parseStatus(from), n = parseStatus(next);
  if (!f || !n) return { message: "주문 상태가 올바르지 않습니다." };
  try { await advanceOrderStatus(id, f, n); } catch (e) { refresh(); return fail(e); }
  refresh();
  return { ok: "주문 상태를 바꿨습니다." };
}

/** 관리자 전용 로그인(A-01 2차): 관리자 계정만 로그인시킨다. 회원 계정이면 세션을 만들지 않는다 */
export async function adminLoginAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const email = String(form.get("email") ?? ""), password = String(form.get("password") ?? "");
  const user = email && password ? await authenticate(email, password) : null;
  if (!user) return { message: "이메일 또는 비밀번호가 일치하지 않습니다." };
  if (user.role !== "ADMIN") return { message: "관리자 계정이 아닙니다. 쇼핑몰 로그인은 일반 로그인 화면을 이용해 주세요." };
  await startSession(user.id);
  redirect("/admin/dashboard");
}
