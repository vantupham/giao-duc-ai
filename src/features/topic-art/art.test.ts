import { describe, expect, test } from 'vitest';
import { XMLValidator } from 'fast-xml-parser';
import { topicArtSvg, TOPIC_IDS, CSS_PALETTE } from './art';
import { GRADES, getGrade } from '../../lib/content';

const HEX = { ink: '#1a1f2b', paper: '#fffdf8', line: '#4352c8', accent: '#d9581d' };

describe('hình minh họa chuyên đề', () => {
  test('mỗi chuyên đề trong tài liệu đều có hình', () => {
    const ids = GRADES.flatMap((g) => getGrade(g).topics.map((t) => t.id));
    expect(ids).toHaveLength(12);
    for (const id of ids) expect(TOPIC_IDS).toContain(id);
  });

  test.each(TOPIC_IDS)('hình %s là SVG hợp lệ với cả màu CSS và màu hex', (id) => {
    for (const p of [CSS_PALETTE, HEX]) {
      const svg = topicArtSvg(id, p)!;
      expect(XMLValidator.validate(svg)).toBe(true);
      expect(svg).not.toContain('undefined');
      expect(svg).not.toContain('NaN');
    }
  });

  test('chuyên đề không có thì trả về null', () => {
    expect(topicArtSvg('9.9', HEX)).toBeNull();
  });
});
