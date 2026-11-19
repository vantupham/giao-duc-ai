import { describe, expect, test } from 'vitest';
import { layoutMetro, METRO, type MetroGradeInput } from './layout';
import { GRADES, getGrade, lessonsOfTopic } from '../../lib/content';

const realGrades: MetroGradeInput[] = GRADES.map((g) => ({
  grade: g,
  topics: getGrade(g).topics.map((t) => ({
    id: t.id,
    title: t.title,
    lessons: lessonsOfTopic(t.id).map((l) => ({ slug: l.slug, id: l.id, title: l.title })),
  })),
}));

describe('bản đồ tuyến', () => {
  const map = layoutMetro(realGrades);

  test('có đủ 36 ga, 3 tuyến và 2 đoạn chuyển tuyến', () => {
    expect(map.stations).toHaveLength(36);
    expect(map.lines).toHaveLength(3);
    expect(map.bends.map((b) => [b.from, b.to])).toEqual([
      [10, 11],
      [11, 12],
    ]);
  });

  test('tuyến 11 chạy ngược chiều để nối liền cuối tuyến 10', () => {
    const row = (g: number) => map.stations.filter((s) => s.grade === g);
    expect(row(10)[0].x).toBeLessThan(row(10)[11].x);
    expect(row(11)[0].x).toBeGreaterThan(row(11)[11].x);
    expect(row(11)[0].x).toBeCloseTo(row(10)[11].x, 0);
    expect(row(12)[0].x).toBeCloseTo(row(11)[11].x, 0);
  });

  test('các ga nằm trong khung và không chồng lên nhau', () => {
    for (const s of map.stations) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(METRO.width);
      expect(s.y).toBeLessThan(map.height);
    }
    for (let i = 0; i < map.stations.length; i++)
      for (let j = i + 1; j < map.stations.length; j++) {
        const a = map.stations[i];
        const b = map.stations[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(40);
      }
  });

  test('mỗi chuyên đề có một nhãn, ga đầu và cuối chuyên đề là ga lớn', () => {
    expect(map.topics).toHaveLength(12);
    const t = map.stations.filter((s) => s.topicId === '11.4');
    expect(t.map((s) => s.isTerminal)).toEqual([true, false, false, true]);
  });

  test('dữ liệu rỗng không gây lỗi', () => {
    expect(layoutMetro([{ grade: 10, topics: [] }]).stations).toEqual([]);
  });
});
