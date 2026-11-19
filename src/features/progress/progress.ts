// Sổ tiến độ của học sinh: chỉ lưu trên máy, không tài khoản. Mọi hàm trả về bản mới, không sửa bản cũ.

import type { Mastery } from '../worksheet/types';

export interface LessonProgress {
  sections: string[];
  labs: string[];
  mastery: Record<string, Mastery> | null;
  lastVisit: number;
}

export interface Progress {
  v: 1;
  lessons: Record<string, LessonProgress>;
  last: string | null;
}

export type LessonStatus = 'new' | 'started' | 'done';

export const PROGRESS_KEY = 'gdai.progress.v1';
/** Đọc được từ tỉ lệ này số mục trở lên thì coi như đã học xong bài (khi chưa làm phiếu). */
export const DONE_RATIO = 0.8;
const MAX_ITEMS = 60;
const MASTERY_VALUES: readonly Mastery[] = ['chua-dat', 'dat', 'tot'];
const SLUG_RE = /^bai-\d{2}-\d{2}$/;

export const emptyProgress = (): Progress => ({ v: 1, lessons: {}, last: null });

const emptyLesson = (): LessonProgress => ({ sections: [], labs: [], mastery: null, lastVisit: 0 });

function withLesson(p: Progress, slug: string, now: number, change: (l: LessonProgress) => LessonProgress): Progress {
  if (!SLUG_RE.test(slug)) return p;
  const current = p.lessons[slug] ?? emptyLesson();
  return { ...p, last: slug, lessons: { ...p.lessons, [slug]: { ...change(current), lastVisit: now } } };
}

const addUnique = (list: string[], item: string) => (list.includes(item) ? list : [...list, item].slice(-MAX_ITEMS));

export const visitLesson = (p: Progress, slug: string, now: number) => withLesson(p, slug, now, (l) => l);

export const markSection = (p: Progress, slug: string, sectionId: string, now: number) =>
  withLesson(p, slug, now, (l) => ({ ...l, sections: addUnique(l.sections, sectionId) }));

export const markLab = (p: Progress, slug: string, lab: string, now: number) =>
  withLesson(p, slug, now, (l) => ({ ...l, labs: addUnique(l.labs, lab) }));

export const setMastery = (p: Progress, slug: string, mastery: Record<string, Mastery>, now: number) =>
  withLesson(p, slug, now, (l) => ({ ...l, mastery: { ...mastery } }));

export function lessonStatus(p: Progress, slug: string, totalSections: number): LessonStatus {
  const l = p.lessons[slug];
  if (!l) return 'new';
  if (l.mastery) return 'done';
  if (totalSections > 0 && l.sections.length / totalSections >= DONE_RATIO) return 'done';
  return 'started';
}

/** Bài nên học tiếp: bài mở gần nhất nếu chưa xong, nếu xong thì bài kế tiếp trong danh sách. */
export function continueTarget(p: Progress, order: readonly { slug: string; sections: number }[]): string | null {
  if (!p.last) return null;
  const i = order.findIndex((x) => x.slug === p.last);
  if (i < 0) return null;
  if (lessonStatus(p, p.last, order[i].sections) !== 'done') return p.last;
  return order[i + 1]?.slug ?? null;
}

const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length < 120);

function sanitizeMastery(v: unknown): Record<string, Mastery> | null {
  if (!v || typeof v !== 'object') return null;
  const entries = Object.entries(v as Record<string, unknown>).filter(
    (e): e is [string, Mastery] => /^M\d{1,2}$/.test(e[0]) && MASTERY_VALUES.includes(e[1] as Mastery),
  );
  return entries.length ? Object.fromEntries(entries) : null;
}

/** Dữ liệu đọc từ bộ nhớ trình duyệt có thể hỏng hoặc bị sửa tay: chỉ giữ phần hợp lệ. */
export function sanitizeProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return emptyProgress();
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || !r.lessons || typeof r.lessons !== 'object') return emptyProgress();
  const lessons: Record<string, LessonProgress> = {};
  for (const [slug, value] of Object.entries(r.lessons as Record<string, unknown>)) {
    if (!SLUG_RE.test(slug) || !value || typeof value !== 'object') continue;
    const l = value as Record<string, unknown>;
    lessons[slug] = {
      sections: isStringList(l.sections) ? l.sections.slice(-MAX_ITEMS) : [],
      labs: isStringList(l.labs) ? l.labs.slice(-MAX_ITEMS) : [],
      mastery: sanitizeMastery(l.mastery),
      lastVisit: typeof l.lastVisit === 'number' && Number.isFinite(l.lastVisit) ? l.lastVisit : 0,
    };
  }
  const last = typeof r.last === 'string' && lessons[r.last] ? r.last : null;
  return { v: 1, lessons, last };
}
