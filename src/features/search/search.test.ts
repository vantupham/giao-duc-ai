import { describe, expect, test } from 'vitest';
import { foldSameLength, prepareDocs, searchDocs, tokenize, type SearchDoc } from './search';
import { buildSearchDocs } from './buildIndex';

const DOCS: SearchDoc[] = [
  { u: 'bai/bai-11-10', t: 'Bài 11.10. Mạng nơ-ron nhân tạo', s: 'Lớp 11', k: 'bai', g: 11, x: 'Một nơ-ron, trọng số và ngưỡng.' },
  { u: 'bai/bai-11-10#a', t: 'Mạng nơ-ron nhân tạo', s: '1. Một nơ-ron', k: 'muc', g: 11, x: 'Mỗi tín hiệu nhân với một trọng số rồi cộng lại. Trọng số lớn là quan trọng.' },
  { u: 'tu-dien#chu-T', t: 'Trọng số', s: 'Bài 11.10', k: 'tu', g: 11, x: 'Mức quan trọng của một tín hiệu vào.' },
  { u: 'bai/bai-10-01', t: 'Bài 10.1. Con người ở đâu', s: 'Lớp 10', k: 'bai', g: 10, x: 'Ba vai trò của con người.' },
];
const index = prepareDocs(DOCS);

describe('tìm kiếm toàn site', () => {
  test('bỏ dấu mà giữ nguyên độ dài chuỗi', () => {
    const s = 'Trọng số Đầu ra ẫ';
    expect(foldSameLength(s)).toBe('trong so dau ra a');
    expect(foldSameLength(s)).toHaveLength(s.length);
  });

  test('gõ không dấu vẫn ra, thuật ngữ khớp đúng tên đứng đầu', () => {
    const hits = searchDocs(index, 'trong so');
    expect(hits[0].doc.u).toBe('tu-dien#chu-T');
    expect(hits.map((h) => h.doc.u).sort()).toEqual(['bai/bai-11-10', 'bai/bai-11-10#a', 'tu-dien#chu-T']);
  });

  test('khớp nguyên cụm xếp trên khớp từng từ rời ("trong … số")', () => {
    const idx = prepareDocs([
      { u: 'a', t: 'Bốn tấm khiên trong không gian số', s: 'Bài 10.3', k: 'muc', g: 10, x: 'An toàn khi ở trong không gian số.' },
      { u: 'b', t: 'Một nơ-ron nhân tạo', s: 'Bài 11.10', k: 'muc', g: 11, x: 'Mỗi tín hiệu có một trọng số. Trọng số lớn thì quan trọng.' },
    ]);
    expect(searchDocs(idx, 'trong so')[0].doc.u).toBe('b');
    expect(searchDocs(idx, 'trọng số')[0].doc.u).toBe('b');
    expect(searchDocs(idx, 'không gian số')[0].doc.u).toBe('a');
  });

  test('mọi từ trong câu tìm đều phải có', () => {
    expect(searchDocs(index, 'trọng số con người')).toEqual([]);
    expect(searchDocs(index, 'vai tro')[0].doc.u).toBe('bai/bai-10-01');
  });

  test('đoạn trích giữ nguyên chữ có dấu quanh chỗ khớp', () => {
    const hit = searchDocs(index, 'trong so').find((h) => h.doc.k === 'muc')!;
    expect(hit.snippet!.match).toBe('trọng số');
    expect(hit.snippet!.before.endsWith('với một ')).toBe(true);
  });

  test('câu tìm rỗng hoặc toàn khoảng trắng không trả kết quả', () => {
    expect(tokenize('   ')).toEqual([]);
    expect(searchDocs(index, '  ')).toEqual([]);
  });

  test('chỉ mục thật có đủ 36 bài, các mục, thuật ngữ và mô phỏng', () => {
    const docs = buildSearchDocs();
    expect(docs.filter((d) => d.k === 'bai')).toHaveLength(36);
    expect(docs.filter((d) => d.k === 'lab')).toHaveLength(5);
    expect(docs.filter((d) => d.k === 'tu').length).toBeGreaterThan(150);
    expect(docs.filter((d) => d.k === 'muc').length).toBeGreaterThan(300);
    const real = prepareDocs(docs);
    expect(searchDocs(real, 'no ron')[0].doc.u).toContain('bai-11-10');
    expect(docs.every((d) => !d.u.startsWith('/'))).toBe(true);
  });
});
