// 12 hình minh họa nét đơn cho 12 chuyên đề. Cùng một phong cách: nét mực dày, mảng màu tuyến và màu nhấn.
// Trả về chuỗi SVG để dùng được cả trên trang (màu theo biến CSS) lẫn khi vẽ ảnh chia sẻ (màu hex).

export interface ArtPalette {
  ink: string;
  paper: string;
  /** màu tuyến của khối */
  line: string;
  accent: string;
}

export const CSS_PALETTE: ArtPalette = { ink: 'var(--ink)', paper: 'var(--card)', line: 'var(--lc)', accent: 'var(--accent)' };

type Draw = (p: ArtPalette, s: string) => string;

const ground = (p: ArtPalette) => `<path d="M24 142H216" stroke="${p.ink}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>`;
const sparkle = (p: ArtPalette, x: number, y: number, r = 9) =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>`;

const DRAW: Record<string, Draw> = {
  // Con người làm chủ AI: người cầm dây điều khiển, robot ở dưới tay
  '10.1': (p, s) => `${ground(p)}
    <rect x="128" y="62" width="82" height="72" rx="12" fill="${p.paper}" ${s}/>
    <path d="M169 62V44" ${s}/><circle cx="169" cy="40" r="5" fill="${p.accent}" ${s}/>
    <circle cx="152" cy="90" r="5" fill="${p.ink}"/><circle cx="186" cy="90" r="5" fill="${p.ink}"/>
    <path d="M156 112H182" ${s}/>
    <circle cx="62" cy="48" r="17" fill="${p.line}" ${s}/>
    <path d="M62 65V112M62 112L46 140M62 112L78 140M62 82L104 98" ${s}/>
    <path d="M104 98Q122 104 128 118" ${s} stroke-dasharray="1 7"/>
    <circle cx="104" cy="98" r="7" fill="${p.accent}" ${s}/>`,

  // Đúng quy định, có đạo đức: cán cân
  '10.2': (p, s) => `${ground(p)}
    <path d="M120 30V128M92 132H148" ${s}/>
    <path d="M52 52H188" ${s}/><circle cx="120" cy="30" r="7" fill="${p.accent}" ${s}/>
    <path d="M60 52L40 98M60 52L80 98M180 52L160 98M180 52L200 98" ${s}/>
    <path d="M36 98H84Q78 120 60 120Q42 120 36 98Z" fill="${p.line}" ${s}/>
    <path d="M156 98H204Q198 120 180 120Q162 120 156 98Z" fill="${p.paper}" ${s}/>
    <path d="M170 104l7 7 12-14" ${s}/>`,

  // Ứng dụng AI và kĩ năng đặt câu lệnh: khung lệnh và câu trả lời
  '10.3': (p, s) => `
    <path d="M28 32H170Q182 32 182 44V86Q182 98 170 98H70L48 114V98H40Q28 98 28 86V44Q28 32 40 32Z" fill="${p.paper}" ${s}/>
    <path d="M46 52H140M46 66H122M46 80H96" ${s}/>
    <rect x="102" y="74" width="10" height="13" fill="${p.accent}"/>
    <rect x="92" y="104" width="122" height="40" rx="12" fill="${p.line}" ${s}/>
    <path d="M108 120H180M108 132H156" stroke="${p.paper}" stroke-width="3" stroke-linecap="round"/>
    ${sparkle(p, 200, 34, 12)}${sparkle(p, 214, 64, 6)}`,

  // Dữ liệu và hệ thống AI: dữ liệu → mô hình → đầu ra
  '10.4': (p, s) => `${ground(p)}
    <path d="M28 54V122Q28 132 52 132Q76 132 76 122V54" fill="${p.line}" ${s}/>
    <ellipse cx="52" cy="54" rx="24" ry="9" fill="${p.paper}" ${s}/>
    <path d="M28 78Q28 88 52 88Q76 88 76 78M28 100Q28 110 52 110Q76 110 76 100" ${s}/>
    <path d="M84 92H102M96 86l7 6-7 6" ${s}/>
    <circle cx="132" cy="92" r="24" fill="${p.paper}" ${s} stroke-dasharray="7 4"/>
    <circle cx="132" cy="92" r="9" fill="${p.accent}" ${s}/>
    <path d="M162 92H178M172 86l7 6-7 6" ${s}/>
    <rect x="184" y="68" width="34" height="48" rx="6" fill="${p.paper}" ${s}/>
    <path d="M192 84h18M192 96h12" ${s}/>`,

  // Dùng AI an toàn để nâng cao năng lực: khiên và bậc thang đi lên
  '11.1': (p, s) => `${ground(p)}
    <path d="M30 140H66V118H96V96H126" ${s}/>
    <path d="M126 96l-8-8M126 96l-8 8" ${s}/>
    <path d="M166 22L206 38V72Q206 104 166 124Q126 104 126 72V38Z" fill="${p.line}" ${s}/>
    <path d="M150 72l11 11 21-23" stroke="${p.paper}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="48" cy="104" r="12" fill="${p.accent}" ${s}/><path d="M48 116V140" ${s}/>`,

  // AI bền vững, công bằng và quyền người dùng: chiếc lá, ổ khóa, dấu bằng
  '11.2': (p, s) => `${ground(p)}
    <path d="M30 120Q30 50 100 40Q100 112 30 120Z" fill="${p.line}" ${s}/>
    <path d="M30 120Q58 86 82 62" ${s}/>
    <rect x="112" y="76" width="50" height="44" rx="8" fill="${p.paper}" ${s}/>
    <path d="M122 76V64Q122 50 137 50Q152 50 152 64V76" fill="none" ${s}/>
    <circle cx="137" cy="96" r="6" fill="${p.accent}" ${s}/>
    <path d="M180 82H212M180 100H212" stroke="${p.ink}" stroke-width="6" stroke-linecap="round"/>`,

  // AI trong học tập và prompt nâng cao: sách mở, khung lệnh có cấu trúc
  '11.3': (p, s) => `
    <path d="M24 120Q72 104 120 124Q168 104 216 120V146Q168 130 120 148Q72 130 24 146Z" fill="${p.paper}" ${s}/>
    <path d="M120 124V148" ${s}/>
    <rect x="54" y="18" width="132" height="86" rx="12" fill="${p.paper}" ${s}/>
    <rect x="66" y="32" width="26" height="12" rx="3" fill="${p.accent}"/><path d="M100 38H170" ${s}/>
    <rect x="66" y="54" width="26" height="12" rx="3" fill="${p.line}"/><path d="M100 60H158" ${s}/>
    <rect x="66" y="76" width="26" height="12" rx="3" fill="${p.ink}"/><path d="M100 82H146" ${s}/>`,

  // Bên trong hệ thống AI: mạng nơ-ron ba lớp
  '11.4': (p, s) => {
    const L = [
      [40, [44, 80, 116]],
      [120, [30, 62, 98, 130]],
      [200, [62, 98]],
    ] as const;
    const lines: string[] = [];
    for (let a = 0; a < L.length - 1; a++)
      for (const y1 of L[a][1]) for (const y2 of L[a + 1][1]) lines.push(`<path d="M${L[a][0]} ${y1}L${L[a + 1][0]} ${y2}" stroke="${p.ink}" stroke-width="1.6" opacity=".55"/>`);
    const nodes = L.flatMap(([x, ys], li) =>
      ys.map((y, i) => `<circle cx="${x}" cy="${y}" r="12" fill="${li === 1 ? (i % 2 ? p.accent : p.paper) : p.line}" ${s}/>`),
    );
    return lines.join('') + nodes.join('');
  },

  // Quyền kiểm soát và trách nhiệm giải trình trong vòng đời AI: vòng đời có các trạm kiểm tra
  '12.1': (p, s) => `
    <circle cx="120" cy="82" r="56" fill="none" ${s} stroke-dasharray="14 8"/>
    <path d="M176 82l-8-10M176 82l9-9" ${s}/>
    ${[0, 90, 180, 270]
      .map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return `<circle cx="${(120 + 56 * Math.cos(r)).toFixed(1)}" cy="${(82 + 56 * Math.sin(r)).toFixed(1)}" r="10" fill="${i === 0 ? p.accent : p.line}" ${s}/>`;
      })
      .join('')}
    <circle cx="114" cy="76" r="18" fill="${p.paper}" ${s}/><path d="M127 89L142 104" stroke="${p.ink}" stroke-width="6" stroke-linecap="round"/>`,

  // Đạo đức, rủi ro và trách nhiệm công dân: ma trận rủi ro
  '12.2': (p, s) => {
    const cells: string[] = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const heat = r + (2 - c);
        const fill = heat >= 3 ? p.accent : heat === 2 ? p.line : p.paper;
        cells.push(`<rect x="${50 + c * 38}" y="${26 + (2 - r) * 38}" width="34" height="34" rx="5" fill="${fill}" ${s}/>`);
      }
    return `<path d="M40 20V140H170" ${s}/><path d="M34 28l6-8 6 8M162 134l8 6-8 6" ${s}/>${cells.join('')}
      <path d="M196 30L222 76H170Z" fill="${p.paper}" ${s}/><path d="M196 46V60" ${s}/><circle cx="196" cy="68" r="2.5" fill="${p.ink}"/>`;
  },

  // Công cụ phát triển và đánh giá hiệu quả hệ thống AI: đồng hồ đo và biểu đồ cột
  '12.3': (p, s) => `${ground(p)}
    <path d="M30 112A54 54 0 0 1 138 112" fill="none" ${s}/>
    <path d="M30 112A54 54 0 0 1 58 65" fill="none" stroke="${p.line}" stroke-width="10" stroke-linecap="round"/>
    <path d="M58 65A54 54 0 0 1 112 64" fill="none" stroke="${p.accent}" stroke-width="10" stroke-linecap="round"/>
    <path d="M84 112L112 76" stroke="${p.ink}" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="112" r="7" fill="${p.ink}"/>
    <rect x="156" y="98" width="16" height="42" rx="3" fill="${p.paper}" ${s}/>
    <rect x="178" y="74" width="16" height="66" rx="3" fill="${p.line}" ${s}/>
    <rect x="200" y="50" width="16" height="90" rx="3" fill="${p.accent}" ${s}/>`,

  // Giải pháp và hợp tác phát triển sản phẩm AI: ba người quanh một sản phẩm
  '12.4': (p, s) => `${ground(p)}
    <rect x="92" y="70" width="56" height="56" rx="10" fill="${p.paper}" ${s}/>
    <path d="M106 98l9 9 18-20" ${s}/>
    ${sparkle(p, 156, 60, 10)}
    <circle cx="44" cy="70" r="14" fill="${p.line}" ${s}/><path d="M44 84V118M44 98L90 96" ${s}/>
    <circle cx="196" cy="70" r="14" fill="${p.accent}" ${s}/><path d="M196 84V118M196 98L150 96" ${s}/>
    <circle cx="120" cy="30" r="12" fill="${p.ink}"/><path d="M120 42V70" ${s}/>`,
};

export const TOPIC_IDS = Object.keys(DRAW);

/** Hình minh họa của một chuyên đề dưới dạng SVG hoàn chỉnh (viewBox 240×160), hoặc null nếu chưa có. */
export function topicArtSvg(topicId: string, p: ArtPalette, attrs = ''): string | null {
  const draw = DRAW[topicId];
  if (!draw) return null;
  const s = `stroke="${p.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none" ${attrs}>${draw(p, s)}</svg>`;
}
