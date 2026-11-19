// Tiến độ mẫu để thầy cô xem trước bản đồ khi đã học được một phần năm học (chỉ dùng trong bản mẫu).

import { emptyProgress, markLab, markSection, setMastery, type Progress } from './progress';

const pad = (n: number) => String(n).padStart(2, '0');
const FAKE_SECTIONS = Array.from({ length: 20 }, (_, i) => `doc-${i}`);

export function demoProgress(now: number): Progress {
  let p = emptyProgress();
  const doneSlugs = [...Array.from({ length: 12 }, (_, i) => `bai-10-${pad(i + 1)}`), ...Array.from({ length: 9 }, (_, i) => `bai-11-${pad(i + 1)}`)];
  doneSlugs.forEach((slug, i) => {
    for (const s of FAKE_SECTIONS) p = markSection(p, slug, s, now - (40 - i) * 86_400_000);
  });
  p = setMastery(p, 'bai-10-04', { M1: 'tot', M2: 'dat', M3: 'dat' }, now - 30 * 86_400_000);
  p = setMastery(p, 'bai-10-11', { M1: 'tot', M2: 'chua-dat', M3: 'dat' }, now - 22 * 86_400_000);
  p = markLab(p, 'bai-10-11', 'recycling-station', now - 22 * 86_400_000);
  for (const s of ['khoi-dong-so-1-hay-so-7', '1-mot-no-ron-nhan-tao-co-may-can-nhac-ti-hon']) p = markSection(p, 'bai-11-10', s, now);
  return markLab(p, 'bai-11-10', 'neuron', now);
}
