// API 공통 응답 형식(기술 설계서 7장): 성공 { data }, 실패 { error, message }
export const ok = (data: unknown, status = 200) => Response.json({ data }, { status });
export const fail = (status: number, error: string, message: string, extra?: Record<string, unknown>) =>
  Response.json({ error, message, ...extra }, { status });

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try { const v = await request.json(); return v && typeof v === "object" ? v : null; } catch { return null; }
}
