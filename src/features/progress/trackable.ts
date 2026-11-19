import type { Lesson, Section } from '../../lib/types';

/** Các mục được tính vào tiến độ đọc: có tiêu đề, trừ thuật ngữ và gợi ý trả lời. */
export const trackableSections = (lesson: Lesson): Section[] =>
  lesson.sections.filter((s) => s.title && s.kind !== 'answers' && s.kind !== 'glossary');

export interface LessonOrderItem {
  slug: string;
  id: string;
  title: string;
  sections: number;
}

export const lessonOrder = (lessons: readonly Lesson[]): LessonOrderItem[] =>
  lessons.map((l) => ({ slug: l.slug, id: l.id, title: l.title, sections: trackableSections(l).length }));
