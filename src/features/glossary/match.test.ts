import { describe, expect, test } from 'vitest';
import { buildTermMatcher, termKey } from './match';

describe('tìm thuật ngữ trong bài', () => {
  const match = buildTermMatcher(['Trọng số', 'Nơ-ron nhân tạo', 'Nơ-ron', 'Học sâu (deep learning)', 'AI']);

  test('bỏ phần chú thích trong ngoặc', () => {
    expect(termKey('Học sâu (deep learning)')).toBe('học sâu');
  });

  test('không phân biệt hoa thường, ưu tiên thuật ngữ dài hơn', () => {
    const hits = match('Mỗi nơ-ron nhân tạo có trọng số riêng.');
    expect(hits.map((h) => h.key)).toEqual(['nơ-ron nhân tạo', 'trọng số']);
  });

  test('không khớp giữa chừng một từ có dấu', () => {
    expect(match('trọng sốt')).toEqual([]);
    expect(match('họcsâu')).toEqual([]);
  });

  test('bỏ thuật ngữ quá ngắn', () => {
    expect(match('AI là gì')).toEqual([]);
  });

  test('vị trí khớp đúng để chèn nút', () => {
    const text = 'Đây là học sâu.';
    const [h] = match(text);
    expect(text.slice(h.start, h.end)).toBe('học sâu');
  });

  test('danh sách rỗng không gây lỗi', () => {
    expect(buildTermMatcher([])('bất kì')).toEqual([]);
  });
});
