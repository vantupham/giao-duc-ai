import { describe, expect, test } from 'vitest';
import { buildSubmitLink, codeFromHash, extractCode } from './submitLink';
import { encodeSubmission, decodeSubmission } from './codec';
import { emptyAnswers } from './scoring';
import { getWorksheet } from './registry';

const ws = getWorksheet('bai-11-10')!;
const code = encodeSubmission({ slug: ws.slug, version: ws.version, className: '11A2', studentNo: 7, name: 'Minh Anh', date: 20261119, answers: emptyAnswers(ws) });

describe('link nộp phiếu', () => {
  test('link trỏ tới trang tổng hợp phiếu, mã nằm sau dấu #', () => {
    const link = buildSubmitLink('https://vantupham.github.io', '/giao-duc-ai/', code);
    expect(link.startsWith('https://vantupham.github.io/giao-duc-ai/giao-vien/tong-hop-phieu/#nop=')).toBe(true);
    expect(new URL(link).search).toBe('');
    expect(buildSubmitLink('https://x.vn', '/giao-duc-ai', 'A')).toBe('https://x.vn/giao-duc-ai/giao-vien/tong-hop-phieu/#nop=A');
  });

  test('đọc lại đúng mã từ link (mã Base45 có dấu cách, %, +, /)', () => {
    const link = buildSubmitLink('https://vantupham.github.io', '/giao-duc-ai/', code);
    expect(extractCode(link)).toBe(code);
    expect(decodeSubmission(extractCode(link)).ok).toBe(true);
  });

  test('mã dán trực tiếp được giữ nguyên', () => {
    expect(extractCode(`  ${code}  `)).toBe(code);
  });

  test('đọc mã từ phần # của trang', () => {
    expect(codeFromHash(`#nop=${encodeURIComponent(code)}`)).toBe(code);
    expect(codeFromHash('')).toBeNull();
    expect(codeFromHash('#bao-cao')).toBeNull();
  });

  test('mã hỏng trong link không làm lỗi', () => {
    expect(extractCode('https://a.vn/#nop=%E0%A4%A')).toBe('https://a.vn/#nop=%E0%A4%A');
  });
});
