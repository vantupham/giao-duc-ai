// Xếp 36 bài thành bản đồ tuyến: mỗi khối một hàng, đi zíc zắc (10 trái→phải, 11 phải→trái, 12 trái→phải).

export interface MetroLessonInput {
  slug: string;
  id: string;
  title: string;
}

export interface MetroTopicInput {
  id: string;
  title: string;
  lessons: MetroLessonInput[];
}

export interface MetroGradeInput {
  grade: number;
  topics: MetroTopicInput[];
}

export interface MetroStation extends MetroLessonInput {
  grade: number;
  topicId: string;
  x: number;
  y: number;
  /** Ga đầu hoặc cuối chuyên đề: vẽ to hơn như ga đổi tuyến. */
  isTerminal: boolean;
}

export interface MetroTopicLabel {
  id: string;
  title: string;
  grade: number;
  x: number;
  y: number;
}

export interface MetroLayout {
  width: number;
  height: number;
  stations: MetroStation[];
  lines: { grade: number; d: string }[];
  bends: { from: number; to: number; d: string }[];
  topics: MetroTopicLabel[];
}

export const METRO = { width: 1120, padX: 90, top: 92, rowGap: 170, topicGap: 30 } as const;

const r1 = (v: number) => Math.round(v * 10) / 10;

export function layoutMetro(grades: readonly MetroGradeInput[]): MetroLayout {
  const { width, padX, top, rowGap, topicGap } = METRO;
  const stations: MetroStation[] = [];
  const topics: MetroTopicLabel[] = [];

  grades.forEach((g, row) => {
    const flat = g.topics.flatMap((t, ti) => t.lessons.map((l, li) => ({ l, t, ti, li })));
    const gaps = Math.max(0, g.topics.length - 1);
    const step = flat.length > 1 ? (width - 2 * padX - gaps * topicGap) / (flat.length - 1) : 0;
    const y = top + row * rowGap;
    const xOf = (i: number, ti: number) => {
      const fromLeft = padX + i * step + ti * topicGap;
      return row % 2 === 0 ? fromLeft : width - fromLeft;
    };
    flat.forEach(({ l, t, ti, li }, i) => {
      stations.push({
        ...l,
        grade: g.grade,
        topicId: t.id,
        x: r1(xOf(i, ti)),
        y,
        isTerminal: li === 0 || li === t.lessons.length - 1,
      });
    });
    let offset = 0;
    g.topics.forEach((t, ti) => {
      const first = xOf(offset, ti);
      const last = xOf(offset + t.lessons.length - 1, ti);
      topics.push({ id: t.id, title: t.title, grade: g.grade, x: r1((first + last) / 2), y: y - 44 });
      offset += t.lessons.length;
    });
  });

  const lines = grades.map((g) => {
    const pts = stations.filter((s) => s.grade === g.grade);
    return { grade: g.grade, d: pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') };
  });

  const bends = grades.slice(0, -1).map((g, row) => {
    const a = stations.filter((s) => s.grade === g.grade).at(-1)!;
    const b = stations.find((s) => s.grade === grades[row + 1].grade)!;
    const out = row % 2 === 0 ? 1 : -1;
    const bulge = rowGap * 0.62 * out;
    return {
      from: g.grade,
      to: grades[row + 1].grade,
      d: `M${a.x} ${a.y} C${r1(a.x + bulge)} ${a.y} ${r1(b.x + bulge)} ${b.y} ${b.x} ${b.y}`,
    };
  });

  const height = top + (grades.length - 1) * rowGap + 70;
  return { width, height, stations, lines, bends, topics };
}
