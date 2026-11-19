// Tìm thuật ngữ của Từ điển AI trong một đoạn văn (không phân biệt hoa thường, đúng ranh giới từ tiếng Việt).

export interface TermHit {
  start: number;
  end: number;
  /** Khóa thuật ngữ dạng chữ thường, để tra định nghĩa. */
  key: string;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MIN_TERM_LENGTH = 3;

/** Phần chính của thuật ngữ: bỏ phần chú thích trong ngoặc, ví dụ "Học sâu (deep learning)" → "học sâu". */
export const termKey = (term: string): string => term.replace(/\s*\(.*\)\s*$/, '').trim().toLocaleLowerCase('vi');

export function buildTermMatcher(terms: readonly string[]): (text: string) => TermHit[] {
  const keys = [...new Set(terms.map(termKey))].filter((k) => k.length >= MIN_TERM_LENGTH).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return () => [];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${keys.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  return (text: string) =>
    [...text.matchAll(re)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, key: m[0].toLocaleLowerCase('vi') }));
}
