// 현재 방문자(로그인 상태·장바구니 항목 수). 헤더 아이콘·뱃지에 쓴다.
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export type Viewer = { user: { id: string; name: string; role: "MEMBER" | "ADMIN" } | null; cartCount: number };

export async function getViewer(): Promise<Viewer> {
  const user = await getSessionUser();
  if (!user) return { user: null, cartCount: 0 };
  const cartCount = await db.cartItem.count({ where: { userId: user.id } });
  return { user: { id: user.id, name: user.name, role: user.role }, cartCount };
}
