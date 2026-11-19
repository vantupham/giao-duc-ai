// Đường dẫn tới bài học phía trình duyệt (không nạp dữ liệu bài, chỉ đọc danh sách thứ tự nhúng sẵn trong trang).

import { continueTarget, type Progress } from './progress';
import type { LessonOrderItem } from './trackable';

export function readLessonOrder(): LessonOrderItem[] {
  const el = document.getElementById('gdai-lesson-order');
  if (!el?.textContent) return [];
  try {
    const raw: unknown = JSON.parse(el.textContent);
    return Array.isArray(raw)
      ? raw.filter(
          (x): x is LessonOrderItem =>
            typeof x?.slug === 'string' && typeof x?.id === 'string' && typeof x?.title === 'string' && typeof x?.sections === 'number',
        )
      : [];
  } catch {
    return [];
  }
}

export function lessonHref(slug: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/bai/${slug}`;
}

/** Đường dẫn cho nút "Học tiếp", hoặc null nếu em chưa mở bài nào. */
export function lessonUrlBuilder(p: Progress): string | null {
  const slug = continueTarget(p, readLessonOrder());
  return slug ? lessonHref(slug) : null;
}
