import { expect, test } from 'vitest';
import { foldVietnamese } from './text';

test('bỏ dấu tiếng Việt, kể cả chữ đ', () => {
  expect(foldVietnamese('Trọng số Đầu ra')).toBe('trong so dau ra');
  expect(foldVietnamese('Học sâu')).toBe('hoc sau');
});
