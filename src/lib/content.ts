import type { GradeData, Lesson, TeachingInfo, Inline, Block } from './types';
import teachingJson from '../content/generated/teaching.json';

const lessonModules = import.meta.glob<Lesson>('../content/generated/lessons/*.json', { eager: true, import: 'default' });
const gradeModules = import.meta.glob<GradeData>('../content/generated/grades/*.json', { eager: true, import: 'default' });

export const GRADES = [10, 11, 12] as const;

/** Một câu tóm tắt mỗi khối, dùng ở trang chủ và trang khối. */
export const GRADE_TAGLINE: Record<number, string> = {
  10: 'Làm chủ AI: con người, pháp luật, câu lệnh, dữ liệu.',
  11: 'Dùng AI an toàn và nhìn vào bên trong hệ thống AI.',
  12: 'Kiểm soát, đánh giá và hợp tác làm ra sản phẩm AI.',
};

export const lessons: Lesson[] = Object.values(lessonModules).sort((a, b) => a.grade - b.grade || a.num - b.num);

export function getGrade(grade: number): GradeData {
  const g = Object.values(gradeModules).find((x) => x.grade === grade);
  if (!g) throw new Error(`Không có dữ liệu khối ${grade}`);
  return g;
}

export const lessonsOfGrade = (grade: number) => lessons.filter((l) => l.grade === grade);
export const lessonsOfTopic = (topicId: string) => lessons.filter((l) => l.topicId === topicId);

export function getLesson(slug: string): Lesson {
  const l = lessons.find((x) => x.slug === slug);
  if (!l) throw new Error(`Không có bài ${slug}`);
  return l;
}

export function neighbours(slug: string) {
  const i = lessons.findIndex((l) => l.slug === slug);
  return { prev: lessons[i - 1] ?? null, next: lessons[i + 1] ?? null };
}

export const teaching = teachingJson as Record<string, TeachingInfo>;

export const inlineText = (inl: Inline[]) => inl.map((x) => x.text).join('');

/** Lấy văn bản thuần của một ô bảng. */
export const cellText = (cell: Block[]) =>
  cell
    .map((b) => (b.t === 'p' ? inlineText(b.inl) : b.t === 'list' ? b.items.map((i) => inlineText(i.inl)).join('; ') : ''))
    .join(' ')
    .trim();

/** Đường dẫn trong site, tôn trọng base path của GitHub Pages. */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  lesson: Lesson;
}

export function glossary(): GlossaryEntry[] {
  const out: GlossaryEntry[] = [];
  for (const lesson of lessons) {
    for (const s of lesson.sections.filter((x) => x.kind === 'glossary')) {
      for (const b of s.blocks) {
        if (b.t !== 'table') continue;
        for (const row of b.rows) {
          const [term, definition] = row.map(cellText);
          if (term && definition) out.push({ term, definition, lesson });
        }
      }
    }
  }
  return out.sort((a, b) => a.term.localeCompare(b.term, 'vi'));
}
