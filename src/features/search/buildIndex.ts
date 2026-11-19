// Dựng chỉ mục tìm kiếm lúc build từ nội dung bài, Từ điển và danh sách mô phỏng.

import { getGrade, glossary, inlineText, lessons } from '../../lib/content';
import { LAB_PLACEMENTS } from '../labs/registry';
import { foldVietnamese } from '../../lib/text';
import type { Block } from '../../lib/types';
import type { SearchDoc } from './search';

/** Giới hạn chữ cho mỗi mục để chỉ mục không quá nặng. */
const MAX_SECTION_CHARS = 6000;

export function blocksText(blocks: readonly Block[]): string {
  return blocks
    .map((b) => {
      switch (b.t) {
        case 'p':
        case 'question':
          return inlineText(b.inl);
        case 'h3':
          return b.text;
        case 'list':
          return b.items.map((i) => inlineText(i.inl)).join(' ');
        case 'box':
          return `${b.title ?? ''} ${blocksText(b.blocks)}`;
        case 'table':
          return [...b.head, ...b.rows.flat()].map((cell) => blocksText(cell)).join(' ');
        case 'figure':
          return b.caption ?? '';
        default:
          return '';
      }
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const l of lessons) {
    const topic = getGrade(l.grade).topics.find((t) => t.id === l.topicId);
    docs.push({
      u: `bai/${l.slug}`,
      t: `Bài ${l.id}. ${l.title}`,
      s: `Lớp ${l.grade}${topic ? ` · ${topic.title}` : ''}`,
      k: 'bai',
      g: l.grade,
      x: [...l.objectives.map(inlineText), l.keywords.join(', ')].join(' '),
    });
    for (const s of l.sections) {
      if (!s.title || s.kind === 'answers') continue;
      docs.push({ u: `bai/${l.slug}#${s.id}`, t: s.title, s: `Bài ${l.id}. ${l.title}`, k: 'muc', g: l.grade, x: blocksText(s.blocks).slice(0, MAX_SECTION_CHARS) });
    }
  }
  for (const e of glossary()) {
    const letter = foldVietnamese(e.term)[0]?.toUpperCase() ?? '';
    docs.push({ u: `tu-dien#chu-${letter}`, t: e.term, s: `Thuật ngữ · Bài ${e.lesson.id}`, k: 'tu', g: e.lesson.grade, x: e.definition });
  }
  for (const [slug, list] of Object.entries(LAB_PLACEMENTS)) {
    const l = lessons.find((x) => x.slug === slug);
    for (const lab of list) docs.push({ u: `bai/${slug}#lab-${lab.key}`, t: lab.title, s: `Mô phỏng · Bài ${l?.id ?? ''}`, k: 'lab', g: l?.grade ?? null, x: lab.description });
  }
  return docs;
}
