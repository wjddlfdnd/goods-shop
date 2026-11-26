/** 원 단위 금액 표시(PRD 7.4): 28300 → "28,300원" */
export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 연락처 표시(PRD v1.4): 숫자만 저장, 화면에서 하이픈 */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.startsWith("02")) return d.length <= 5 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length <= 9 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 받침에 맞는 목적격 조사(을/를). 한글이 아니면 '을(를)' */
export function eulReul(word: string) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return `${word}을(를)`;
  return (c - 0xac00) % 28 ? `${word}을` : `${word}를`;
}
