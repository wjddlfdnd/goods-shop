// 현재 방문자(로그인 상태·장바구니 수량). feature-auth에서 세션을 읽도록 바뀐다.
export type Viewer = { user: { id: string; name: string; role: "MEMBER" | "ADMIN" } | null; cartCount: number };

export async function getViewer(): Promise<Viewer> {
  return { user: null, cartCount: 0 };
}
