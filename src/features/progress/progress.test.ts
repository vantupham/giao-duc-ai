import { describe, expect, test } from 'vitest';
import { continueTarget, emptyProgress, lessonStatus, markLab, markSection, sanitizeProgress, setMastery, visitLesson } from './progress';

const ORDER = [
  { slug: 'bai-11-09', sections: 5 },
  { slug: 'bai-11-10', sections: 5 },
  { slug: 'bai-11-11', sections: 5 },
];

describe('sổ tiến độ', () => {
  test('bài chưa mở có trạng thái "new"', () => {
    expect(lessonStatus(emptyProgress(), 'bai-11-10', 5)).toBe('new');
  });

  test('đánh dấu mục không sửa bản cũ và không lặp', () => {
    const p0 = emptyProgress();
    const p1 = markSection(p0, 'bai-11-10', 'a', 1);
    const p2 = markSection(p1, 'bai-11-10', 'a', 2);
    expect(p0.lessons).toEqual({});
    expect(p2.lessons['bai-11-10'].sections).toEqual(['a']);
    expect(p2.last).toBe('bai-11-10');
    expect(p2.lessons['bai-11-10'].lastVisit).toBe(2);
  });

  test('đọc từ 80% số mục thì coi là xong', () => {
    let p = emptyProgress();
    for (const s of ['a', 'b', 'c']) p = markSection(p, 'bai-11-10', s, 1);
    expect(lessonStatus(p, 'bai-11-10', 5)).toBe('started');
    p = markSection(p, 'bai-11-10', 'd', 1);
    expect(lessonStatus(p, 'bai-11-10', 5)).toBe('done');
  });

  test('làm phiếu xong thì bài xong dù chưa đọc hết', () => {
    const p = setMastery(visitLesson(emptyProgress(), 'bai-11-10', 1), 'bai-11-10', { M1: 'dat' }, 2);
    expect(lessonStatus(p, 'bai-11-10', 5)).toBe('done');
  });

  test('học tiếp: bài dở dang, hoặc bài kế khi đã xong', () => {
    const started = markLab(emptyProgress(), 'bai-11-10', 'neuron', 1);
    expect(continueTarget(started, ORDER)).toBe('bai-11-10');
    const done = setMastery(started, 'bai-11-10', { M1: 'tot' }, 2);
    expect(continueTarget(done, ORDER)).toBe('bai-11-11');
    expect(continueTarget(emptyProgress(), ORDER)).toBeNull();
  });

  test('bỏ qua mã bài không hợp lệ', () => {
    expect(markSection(emptyProgress(), '../x', 'a', 1)).toEqual(emptyProgress());
  });

  test('làm sạch dữ liệu hỏng trong bộ nhớ', () => {
    expect(sanitizeProgress(null)).toEqual(emptyProgress());
    expect(sanitizeProgress({ v: 2, lessons: {} })).toEqual(emptyProgress());
    const p = sanitizeProgress({
      v: 1,
      last: 'bai-10-01',
      lessons: {
        'bai-10-01': { sections: ['a', 3], labs: ['x'], mastery: { M1: 'tot', M2: 'gioi', hack: 'dat' }, lastVisit: 'x' },
        evil: { sections: [] },
      },
    });
    expect(Object.keys(p.lessons)).toEqual(['bai-10-01']);
    expect(p.lessons['bai-10-01']).toEqual({ sections: [], labs: ['x'], mastery: { M1: 'tot' }, lastVisit: 0 });
    expect(p.last).toBe('bai-10-01');
  });
});
