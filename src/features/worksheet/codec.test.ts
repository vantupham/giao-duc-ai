import { describe, expect, test } from 'vitest';
import { base45Encode, base45Decode, encodeSubmission, decodeSubmission, LIMITS, type Submission } from './codec';

const sample: Submission = {
  slug: 'bai-11-10',
  version: 1,
  className: '11A3',
  studentNo: 12,
  name: 'Nguyễn Thị Lan',
  date: 20261119,
  answers: {
    summary: [3, 1, 0, 2, null],
    questions: [1, 0, [2, 0, 1, 3], [0, 1, 1, 0]],
    applyText: 'Nên dùng mạng nơ-ron vì tiếng chim rất đa dạng, cần nhiều bản ghi âm có nhãn.',
    applyLevel: 2,
    confidence: [3, 4, 2],
    doubts: 'Lớp ẩn học được gì?',
    aiUse: 'Không dùng',
  },
};

describe('base45', () => {
  test('mã hóa theo ví dụ của RFC 9285', () => {
    expect(base45Encode(new TextEncoder().encode('AB'))).toBe('BB8');
    expect(base45Encode(new TextEncoder().encode('Hello!!'))).toBe('%69 VD92EX0');
    expect(new TextDecoder().decode(base45Decode('QED8WEX0'))).toBe('ietf!');
  });

  test('từ chối kí tự không hợp lệ', () => {
    expect(() => base45Decode('abc')).toThrow();
  });
});

describe('encodeSubmission / decodeSubmission', () => {
  test('mã hóa rồi giải mã cho lại đúng dữ liệu, kể cả tiếng Việt', () => {
    const code = encodeSubmission(sample);
    expect(code.startsWith('GDAI1:')).toBe(true);
    expect(/^[0-9A-Z $%*+\-./:]+$/.test(code)).toBe(true);
    const res = decodeSubmission(code);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual(sample);
  });

  test('mã đủ ngắn để quét từ màn hình điện thoại', () => {
    expect(encodeSubmission(sample).length).toBeLessThan(700);
  });

  test('cắt bớt chữ quá dài trước khi mã hóa', () => {
    const long = { ...sample, name: 'x'.repeat(100), answers: { ...sample.answers, applyText: 'a'.repeat(1000) } };
    const res = decodeSubmission(encodeSubmission(long));
    expect(res.ok && res.data.answers.applyText.length).toBe(LIMITS.applyText);
    expect(res.ok && res.data.name.length).toBe(LIMITS.name);
  });

  test('báo lỗi rõ ràng với mã không phải của website', () => {
    expect(decodeSubmission('https://example.com')).toEqual({ ok: false, error: 'Mã QR này không phải phiếu học tập của website.' });
    const broken = decodeSubmission('GDAI1:%%%%');
    expect(broken.ok).toBe(false);
  });

  test('từ chối dữ liệu sai cấu trúc', async () => {
    const { deflateSync, strToU8 } = await import('fflate');
    const bad = 'GDAI1:' + base45Encode(deflateSync(strToU8(JSON.stringify({ v: 1, w: 'bai-1', a: 'không phải mảng' }))));
    expect(decodeSubmission(bad).ok).toBe(false);
  });
});
