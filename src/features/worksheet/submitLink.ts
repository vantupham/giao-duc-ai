// Đường link nộp phiếu: mở trang Tổng hợp phiếu và tự nhận phiếu.
// Mã phiếu đặt sau dấu # nên không bao giờ được gửi lên máy chủ.

export const SUBMIT_PARAM = 'nop';
export const DASHBOARD_PATH = 'giao-vien/tong-hop-phieu/';

/** origin: "https://vantupham.github.io", base: "/giao-duc-ai/" (có hoặc không có dấu / cuối). */
export function buildSubmitLink(origin: string, base: string, code: string): string {
  const root = `${origin}${base.endsWith('/') ? base : `${base}/`}`;
  return `${root}${DASHBOARD_PATH}#${SUBMIT_PARAM}=${encodeURIComponent(code)}`;
}

/** Lấy mã phiếu từ một chuỗi: link nộp phiếu (dán hoặc quét) hoặc chính mã GDAI1:… */
export function extractCode(text: string): string {
  const t = text.trim();
  const m = t.match(new RegExp(`[#?&]${SUBMIT_PARAM}=([^&#\\s]+)`));
  if (!m) return t;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return t;
  }
}

/** Mã phiếu trong phần # của địa chỉ trang hiện tại, hoặc null. */
export function codeFromHash(hash: string): string | null {
  if (!hash.includes(`${SUBMIT_PARAM}=`)) return null;
  const code = extractCode(hash);
  return code === hash.trim() ? null : code;
}
