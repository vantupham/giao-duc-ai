import { describe, expect, test } from 'vitest';
import { blanksOf, wordBank, scoreWorksheet, emptyAnswers, isAnswered } from './scoring';
import type { Worksheet, Answers } from './types';

const ws: Worksheet = {
  slug: 'bai-test',
  lessonId: '0.0',
  title: 'Phiếu thử',
  version: 1,
  objectives: [
    { id: 'M1', text: 'Mục tiêu 1' },
    { id: 'M2', text: 'Mục tiêu 2' },
  ],
  summary: { title: 'Sơ đồ', lines: ['Nhân [[trọng số]], so với [[ngưỡng]]', 'Học từ [[dữ liệu]]'], distractors: ['mô hình'] },
  questions: [
    {
      id: 'q1',
      type: 'single',
      objective: 'M1',
      level: 'thong-hieu',
      prompt: 'Chọn',
      explanation: '',
      options: [{ text: 'A', misconception: 'Nhầm A' }, { text: 'B', correct: true }],
    },
    { id: 'q2', type: 'truefalse', objective: 'M1', level: 'nhan-biet', prompt: 'Đúng hay sai', explanation: '', answer: false, misconception: 'Tin máy hiểu' },
    { id: 'q3', type: 'order', objective: 'M2', level: 'van-dung', prompt: 'Sắp xếp', explanation: '', items: ['a', 'b', 'c'], misconception: 'Sai thứ tự' },
    {
      id: 'q4',
      type: 'classify',
      objective: 'M2',
      level: 'thong-hieu',
      prompt: 'Phân loại',
      explanation: '',
      categories: ['Có', 'Không'],
      items: [{ text: 'x', category: 0 }, { text: 'y', category: 1, misconception: 'Nhầm y' }],
    },
  ],
  apply: { objective: 'M2', prompt: 'Vận dụng', rubric: ['1', '2', '3'] },
};

const perfect = (): Answers => {
  const bank = wordBank(ws);
  return {
    ...emptyAnswers(ws),
    summary: blanksOf(ws).map((b) => bank.indexOf(b)),
    questions: [1, 0, [0, 1, 2], [0, 1]],
    applyLevel: 3,
    confidence: [4, 3],
  };
};

describe('blanksOf / wordBank', () => {
  test('lấy chỗ trống theo thứ tự xuất hiện', () => {
    expect(blanksOf(ws)).toEqual(['trọng số', 'ngưỡng', 'dữ liệu']);
  });

  test('ngân hàng từ gồm đáp án và từ nhiễu, không trùng, sắp theo tiếng Việt', () => {
    expect(wordBank(ws)).toEqual(['dữ liệu', 'mô hình', 'ngưỡng', 'trọng số']);
  });
});

describe('scoreWorksheet', () => {
  test('làm đúng hết thì mọi mục tiêu đạt mức Tốt', () => {
    const r = scoreWorksheet(ws, perfect());
    expect(r.summary).toEqual({ correct: 3, total: 3 });
    expect(r.questions.every((q) => q.correct)).toBe(true);
    expect(r.objectives.map((o) => o.mastery)).toEqual(['tot', 'tot']);
    expect(r.objectives.map((o) => o.confidence)).toEqual([4, 3]);
  });

  test('mục tiêu có phần vận dụng chỉ đạt Tốt khi tự đánh giá mức 3', () => {
    const r = scoreWorksheet(ws, { ...perfect(), applyLevel: 2 });
    expect(r.objectives.find((o) => o.id === 'M2')?.mastery).toBe('dat');
    expect(r.objectives.find((o) => o.id === 'M1')?.mastery).toBe('tot');
  });

  test('đúng một nửa là Đạt, dưới một nửa là Chưa đạt', () => {
    const half = scoreWorksheet(ws, { ...perfect(), questions: [0, 0, [0, 1, 2], [0, 1]] });
    expect(half.objectives[0]).toMatchObject({ correct: 1, total: 2, mastery: 'dat' });
    const none = scoreWorksheet(ws, { ...perfect(), questions: [0, 1, [0, 1, 2], [0, 1]] });
    expect(none.objectives[0]).toMatchObject({ correct: 0, mastery: 'chua-dat' });
  });

  test('ghi nhận lỗi hiểu sai từ phương án nhiễu', () => {
    const r = scoreWorksheet(ws, { ...perfect(), questions: [0, 1, [2, 1, 0], [0, 0]] });
    expect(r.questions.map((q) => q.misconceptions)).toEqual([['Nhầm A'], ['Tin máy hiểu'], ['Sai thứ tự'], ['Nhầm y']]);
  });

  test('câu chưa trả lời bị tính sai và đánh dấu chưa làm', () => {
    const r = scoreWorksheet(ws, emptyAnswers(ws));
    expect(r.questions.every((q) => !q.correct && !q.answered)).toBe(true);
    expect(r.summary.correct).toBe(0);
    expect(r.objectives.every((o) => o.mastery === 'chua-dat')).toBe(true);
  });

  test('câu trả lời sai kiểu dữ liệu không làm hỏng việc chấm', () => {
    const r = scoreWorksheet(ws, { ...perfect(), questions: [[1], 'x' as unknown as number, 5, [0]] });
    expect(r.questions.map((q) => q.correct)).toEqual([false, false, false, false]);
  });
});

describe('isAnswered', () => {
  test('nhận biết từng loại câu đã trả lời đủ chưa', () => {
    expect(isAnswered(ws.questions[0], 1)).toBe(true);
    expect(isAnswered(ws.questions[0], null)).toBe(false);
    expect(isAnswered(ws.questions[3], [0, null as unknown as number])).toBe(false);
    expect(isAnswered(ws.questions[2], [2, 0, 1])).toBe(true);
  });
});
