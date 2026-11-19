import { describe, expect, test } from 'vitest';
import { worksheets } from './registry';
import { validateWorksheet, emptyAnswers, scoreWorksheet } from './scoring';
import { encodeSubmission } from './codec';
import { lessons } from '../../lib/content';

describe('các phiếu học tập đã soạn', () => {
  test('có ít nhất ba phiếu thí điểm', () => {
    expect(worksheets.map((w) => w.slug)).toEqual(expect.arrayContaining(['bai-10-04', 'bai-10-11', 'bai-11-10']));
  });

  test.each(worksheets.map((w) => [w.slug, w] as const))('%s đúng quy tắc biên soạn', (_slug, ws) => {
    expect(validateWorksheet(ws)).toEqual([]);
  });

  test.each(worksheets.map((w) => [w.slug, w] as const))('%s gắn với một bài có thật và đủ số mục tiêu', (slug, ws) => {
    const lesson = lessons.find((l) => l.slug === slug);
    expect(lesson?.id).toBe(ws.lessonId);
    expect(ws.objectives.length).toBe(lesson?.objectives.length);
  });

  test.each(worksheets.map((w) => [w.slug, w] as const))('%s tạo được mã QR vừa kích thước khi làm đủ', (_slug, ws) => {
    const answers = {
      ...emptyAnswers(ws),
      summary: emptyAnswers(ws).summary.map(() => 9),
      questions: ws.questions.map((q) => (q.type === 'order' || q.type === 'classify' ? q.items.map((_, i) => i) : 1)),
      applyText: 'Đ'.repeat(400),
      doubts: 'ư'.repeat(300),
      aiUse: 'ộ'.repeat(200),
      applyLevel: 3,
      confidence: ws.objectives.map(() => 4),
    };
    expect(scoreWorksheet(ws, answers).questions).toHaveLength(ws.questions.length);
    const code = encodeSubmission({ slug: ws.slug, version: ws.version, className: '10A1', studentNo: 45, name: 'Nguyễn Hoàng Bảo Ngọc', date: 20261119, answers });
    expect(code.length).toBeLessThan(1100);
  });
});
