// Tô trạng thái học (đã học / đang học / học tiếp) lên mọi phần tử có data-slug trong một vùng trang.

import { loadProgress } from './store';
import { continueTarget, lessonStatus, type Progress } from './progress';
import { readLessonOrder } from './links';
import type { LessonOrderItem } from './trackable';

export interface PaintResult {
  progress: Progress;
  order: LessonOrderItem[];
  current: string | null;
}

export function paintLessonStatus(root: ParentNode): PaintResult {
  const progress = loadProgress();
  const order = readLessonOrder();
  const current = continueTarget(progress, order);
  const total = (slug: string) => order.find((o) => o.slug === slug)?.sections ?? 0;
  root.querySelectorAll<HTMLElement | SVGElement>('[data-slug]').forEach((el) => {
    const slug = el.dataset.slug!;
    el.classList.remove('is-done', 'is-started', 'is-current');
    const st = lessonStatus(progress, slug, total(slug));
    if (st !== 'new') el.classList.add(`is-${st}`);
    if (slug === current) el.classList.add('is-current');
  });
  return { progress, order, current };
}
