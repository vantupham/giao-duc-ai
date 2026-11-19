// Tìm kiếm toàn site chạy trong trình duyệt: gõ có dấu hay không dấu đều ra, ưu tiên khớp ở tiêu đề.

export type DocKind = 'bai' | 'muc' | 'tu' | 'lab';

export interface SearchDoc {
  /** đường dẫn trong site, không có base, ví dụ "bai/bai-11-10#1-mot-no-ron" */
  u: string;
  /** tiêu đề chính (tên bài, thuật ngữ, tên mô phỏng) */
  t: string;
  /** dòng phụ: tên mục, bài chứa thuật ngữ… */
  s: string;
  k: DocKind;
  g: number | null;
  /** nội dung chữ thuần */
  x: string;
}

export interface PreparedDoc extends SearchDoc {
  ft: string;
  fs: string;
  fx: string;
}

export interface Snippet {
  before: string;
  match: string;
  after: string;
}

export interface SearchHit {
  doc: PreparedDoc;
  score: number;
  snippet: Snippet | null;
}

const KIND_BONUS: Record<DocKind, number> = { bai: 8, lab: 6, tu: 5, muc: 0 };
const SNIPPET_RADIUS = 70;
const MAX_HITS_PER_TOKEN = 5;

/** Bỏ dấu từng kí tự để chuỗi kết quả DÀI ĐÚNG BẰNG chuỗi gốc (vị trí khớp dùng lại được cho đoạn trích). */
export function foldSameLength(s: string): string {
  let out = '';
  for (const ch of s) {
    const f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
    out += f.length === ch.length ? f : ch.toLowerCase().length === ch.length ? ch.toLowerCase() : ch;
  }
  return out;
}

export const prepareDocs = (docs: readonly SearchDoc[]): PreparedDoc[] =>
  docs.map((d) => ({ ...d, ft: foldSameLength(d.t), fs: foldSameLength(d.s), fx: foldSameLength(d.x) }));

export const tokenize = (q: string): string[] => foldSameLength(q.trim()).split(/\s+/).filter(Boolean);

function countOf(hay: string, needle: string, cap: number): number {
  let n = 0;
  for (let i = hay.indexOf(needle); i >= 0 && n < cap; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
}

function makeSnippet(doc: PreparedDoc, phrase: string, tokens: string[]): Snippet | null {
  let at = doc.fx.indexOf(phrase);
  let len = phrase.length;
  if (at < 0) {
    const first = tokens.map((t) => ({ t, i: doc.fx.indexOf(t) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i)[0];
    if (!first) return null;
    at = first.i;
    len = first.t.length;
  }
  const start = Math.max(0, at - SNIPPET_RADIUS);
  const end = Math.min(doc.x.length, at + len + SNIPPET_RADIUS);
  return {
    before: (start > 0 ? '…' : '') + doc.x.slice(start, at),
    match: doc.x.slice(at, at + len),
    after: doc.x.slice(at + len, end) + (end < doc.x.length ? '…' : ''),
  };
}

export function searchDocs(index: readonly PreparedDoc[], query: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const phrase = tokens.join(' ');
  // khớp đúng dấu khi người dùng có gõ dấu: "trọng số" không nên ngang hàng với "trong … số"
  const exact = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const hasAccents = exact !== phrase;
  const hits: SearchHit[] = [];
  for (const doc of index) {
    const all = `${doc.ft} ${doc.fs} ${doc.fx}`;
    if (!tokens.every((t) => all.includes(t))) continue;
    let score = KIND_BONUS[doc.k];
    // từng từ rời: điểm nhỏ
    for (const t of tokens) {
      if (doc.ft.includes(t)) score += 3;
      if (doc.fs.includes(t)) score += 1;
      score += Math.min(countOf(doc.fx, t, MAX_HITS_PER_TOKEN), 3) * 0.5;
    }
    // nguyên cụm: điểm lớn
    if (doc.ft === phrase) score += 60;
    else if (doc.ft.includes(phrase)) score += 40;
    if (doc.fs.includes(phrase)) score += 15;
    score += countOf(doc.fx, phrase, MAX_HITS_PER_TOKEN) * 4;
    if (hasAccents) {
      if (doc.t.toLowerCase().includes(exact)) score += 25;
      if (doc.x.toLowerCase().includes(exact)) score += 10;
    }
    hits.push({ doc, score, snippet: null });
  }
  return hits
    .sort((a, b) => b.score - a.score || a.doc.u.localeCompare(b.doc.u))
    .slice(0, limit)
    .map((h) => ({ ...h, snippet: makeSnippet(h.doc, phrase, tokens) }));
}
