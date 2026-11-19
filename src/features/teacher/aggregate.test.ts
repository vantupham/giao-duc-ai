import { describe, expect, test } from 'vitest';
import { aggregate, submissionKey, upsert, toCsv, type StoredSubmission } from './aggregate';
import { getWorksheet } from '../worksheet/registry';
import { emptyAnswers } from '../worksheet/scoring';

const ws = getWorksheet('bai-11-10')!;

function sub(no: number, questions: (number | number[] | null)[], confidence = [4, 4, 4], extra: Partial<StoredSubmission['answers']> = {}): StoredSubmission {
  return {
    slug: ws.slug,
    version: ws.version,
    className: '11A3',
    studentNo: no,
    name: `HS ${no}`,
    date: 20261119,
    receivedAt: 1000 + no,
    answers: { ...emptyAnswers(ws), questions, confidence, applyLevel: 3, ...extra },
  };
}

const allRight = [0, 0, 1, [0, 1, 2, 3, 4], [0, 1, 0, 1], 1];

describe('aggregate', () => {
  const subs = [
    sub(2, allRight),
    sub(1, [1, 1, 3, [0, 1, 2, 3, 4], [0, 0, 0, 1], 0], [4, 1, 1], { doubts: 'Lớp ẩn là gì?' }),
    sub(3, [1, 0, 3, null, null, 1]),
  ];
  const agg = aggregate(ws, subs);

  test('sắp học sinh theo số thứ tự', () => {
    expect(agg.students.map((s) => s.sub.studentNo)).toEqual([1, 2, 3]);
  });

  test('đếm phân bố mức đạt theo từng mục tiêu', () => {
    expect(agg.objectives[0]).toMatchObject({ id: 'M1', tot: 1, dat: 1, 'chua-dat': 1 });
  });

  test('gom lỗi hiểu sai phổ biến, nhiều nhất lên đầu', () => {
    const counts = agg.misconceptions.map((m) => m.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    const q3 = agg.misconceptions.find((m) => m.questionId === 'q3');
    expect(q3).toMatchObject({ count: 2 });
    expect(q3?.text).toContain('viết thêm quy tắc');
    expect(agg.misconceptions[0]).toMatchObject({ count: 2, questionId: 'q1' });
    expect(agg.misconceptions[0].students).toHaveLength(2);
    expect(agg.misconceptions.every((m) => m.students.length === m.count)).toBe(true);
    expect(agg.misconceptions[0].students.map((x) => x.studentNo)).toEqual([...agg.misconceptions[0].students.map((x) => x.studentNo)].sort((a, b) => a - b));
  });

  test('tính tỉ lệ đúng từng câu', () => {
    expect(agg.questions.find((q) => q.id === 'q1')?.correctRate).toBeCloseTo(1 / 3);
    expect(agg.questions.find((q) => q.id === 'q6')?.correctRate).toBeCloseTo(2 / 3);
  });

  test('phát hiện học sinh tự tin cao nhưng chưa đạt', () => {
    // HS 1 sai cả hai câu của M1 nhưng chọn tự tin 4; HS 3 sai/bỏ trống M2 với tự tin 4.
    expect(agg.overconfident.map((o) => [o.studentNo, o.objective])).toEqual([[1, 'M1'], [3, 'M2']]);
  });

  test('thu thập câu băn khoăn kèm số thứ tự', () => {
    expect(agg.doubts).toEqual([{ studentNo: 1, text: 'Lớp ẩn là gì?' }]);
  });

  test('xuất CSV có tiêu đề và đủ dòng, giữ được tiếng Việt và dấu phẩy', () => {
    const csv = toCsv(ws, agg);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('Số TT');
    expect(lines).toHaveLength(4);
    expect(csv).toContain('"Lớp ẩn là gì?"');
  });
});

describe('upsert', () => {
  test('quét lại cùng học sinh thì ghi đè, không nhân đôi', () => {
    const a = sub(5, allRight);
    const b = { ...sub(5, allRight), receivedAt: 9999 };
    const store = upsert(upsert({}, a), b);
    expect(Object.keys(store)).toEqual([submissionKey(a)]);
    expect(store[submissionKey(a)].receivedAt).toBe(9999);
  });

  test('không thay đổi kho cũ', () => {
    const before = {};
    upsert(before, sub(1, allRight));
    expect(before).toEqual({});
  });
});
