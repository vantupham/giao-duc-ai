import { describe, expect, test } from 'vitest';
import { clampIndex, formatClock, phaseAt } from './plan';

const PLAN = [
  { minutes: 5, label: 'Khởi động' },
  { minutes: 15, label: 'Nơ-ron giấy' },
  { minutes: 20, label: 'Ứng dụng' },
  { minutes: 5, label: 'Phiếu ra cửa' },
];

describe('đồng hồ lên lớp', () => {
  test('xác định giai đoạn theo thời gian đã trôi', () => {
    expect(phaseAt(PLAN, 0)).toMatchObject({ index: 0, label: 'Khởi động', remaining: 300, totalSeconds: 2700, isOver: false });
    expect(phaseAt(PLAN, 299).index).toBe(0);
    expect(phaseAt(PLAN, 300)).toMatchObject({ index: 1, remaining: 900 });
    expect(phaseAt(PLAN, 2699)).toMatchObject({ index: 3, remaining: 1 });
  });

  test('quá giờ thì báo hết giờ và số giây âm', () => {
    expect(phaseAt(PLAN, 2760)).toMatchObject({ isOver: true, label: 'Hết giờ', remaining: -60, fraction: 1 });
  });

  test('bài chưa có tiến trình thì dùng một tiết 45 phút', () => {
    expect(phaseAt([], 60)).toMatchObject({ index: 0, totalSeconds: 2700, remaining: 2640 });
  });

  test('định dạng đồng hồ', () => {
    expect(formatClock(75)).toBe('01:15');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(-30)).toBe('−00:30');
  });

  test('không đi quá trang đầu hoặc cuối', () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(7, 5)).toBe(4);
  });
});
