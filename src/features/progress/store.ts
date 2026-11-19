// Đọc/ghi sổ tiến độ trong trình duyệt và báo cho các phần khác trên trang khi có thay đổi.

import { PROGRESS_KEY, emptyProgress, sanitizeProgress, type Progress } from './progress';

export const PROGRESS_EVENT = 'gdai:progress';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? sanitizeProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* bộ nhớ bị chặn (chế độ ẩn danh…): tiến độ chỉ còn trong lần xem này */
  }
  window.dispatchEvent(new CustomEvent<Progress>(PROGRESS_EVENT, { detail: p }));
}

/** Áp một thay đổi lên sổ tiến độ hiện tại rồi lưu lại. */
export function updateProgress(change: (p: Progress) => Progress): Progress {
  const next = change(loadProgress());
  saveProgress(next);
  return next;
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* không có gì để xóa */
  }
  window.dispatchEvent(new CustomEvent<Progress>(PROGRESS_EVENT, { detail: emptyProgress() }));
}
