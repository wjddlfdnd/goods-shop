"use server";
// 마이페이지 서버 액션(U-03·U-04)
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AccountError, addressSchema, deleteAddress, profileSchema, saveAddress, setDefaultAddress, updateProfile } from "@/lib/account";
import { fieldErrors, type FieldErrors } from "@/lib/validation";

export type AccountState = { errors?: FieldErrors; message?: string; ok?: string } | undefined;

async function me() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  return user;
}

export async function updateProfileAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await me();
  const parsed = profileSchema.safeParse({ name: form.get("name"), phone: form.get("phone") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await updateProfile(user.id, parsed.data);
  refresh();
  return { ok: "회원 정보를 저장했습니다." };
}

export async function saveAddressAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await me();
  const parsed = addressSchema.safeParse({
    recipient: form.get("recipient"), phone: form.get("phone"), address1: form.get("address1"),
    address2: form.get("address2") ?? "", isDefault: form.get("isDefault") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await saveAddress(user.id, String(form.get("id") ?? "") || null, parsed.data);
  } catch (e) {
    if (e instanceof AccountError) return { message: e.message };
    throw e;
  }
  redirect("/account/addresses?saved=1");
}

export async function setDefaultAddressAction(id: string): Promise<AccountState> {
  const user = await me();
  try { await setDefaultAddress(user.id, id); } catch (e) { if (e instanceof AccountError) return { message: e.message }; throw e; }
  refresh();
  return undefined;
}

export async function deleteAddressAction(id: string): Promise<AccountState> {
  const user = await me();
  try { await deleteAddress(user.id, id); } catch (e) { if (e instanceof AccountError) return { message: e.message }; throw e; }
  refresh();
  return undefined;
}
