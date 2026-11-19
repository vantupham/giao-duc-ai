// Đọc slide bài giảng (.pptx) để lấy tiến trình dạy học và phiếu ra cửa cho chế độ giáo viên.
import { unzipSync, strFromU8 } from 'fflate';

function slideParagraphs(xml) {
  return xml
    .split('</a:p>')
    .map((p) =>
      [...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
        .map((m) => m[1])
        .join('')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim(),
    )
    .filter(Boolean);
}

/** Tiến trình trên slide "Hôm nay chúng ta làm gì?": các cặp "5'" + tên hoạt động. */
export function parsePlan(lines) {
  const plan = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const m = lines[i].match(/^(\d+)['’]$/);
    if (m && !/^\d+['’]?$/.test(lines[i + 1])) plan.push({ minutes: Number(m[1]), label: lines[i + 1] });
  }
  return plan;
}

/** Câu hỏi phiếu ra cửa: các dòng sau số thứ tự trên slide "Phiếu ra cửa". */
export function parseExitTicket(lines) {
  const start = lines.findIndex((l) => /^Phiếu ra cửa/.test(l));
  if (start < 0) return [];
  const qs = [];
  for (let i = start + 1; i < lines.length - 1; i++) {
    if (/^\d$/.test(lines[i]) && lines[i + 1].length > 20) qs.push(lines[i + 1]);
  }
  return qs;
}

export function readPptx(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  const slideNames = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const slides = slideNames.map((n) => slideParagraphs(strFromU8(files[n])));
  const planSlide = slides.find((s) => s.some((l) => /^Hôm nay chúng ta làm gì/.test(l))) ?? [];
  const exitSlide = slides.findLast((s) => /^Phiếu ra cửa/.test(s[0] ?? '')) ?? [];
  return {
    slideCount: slides.length,
    plan: parsePlan(planSlide),
    exitTicket: parseExitTicket(exitSlide),
  };
}
