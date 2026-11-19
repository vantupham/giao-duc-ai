// Vẽ ảnh xem trước 1200×630 (Zalo, Facebook, Messenger…) lúc build. Chỉ chạy trên máy build, không tải về trình duyệt.

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { topicArtSvg } from '../topic-art/art';

export interface OgCard {
  kicker: string;
  title: string;
  subtitle?: string;
  /** Chuyên đề có hình minh họa, ví dụ "11.4". */
  topicId?: string | null;
  grade?: number | null;
  tags?: string[];
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

const C = {
  paper: '#f5f1e6',
  card: '#fffdf8',
  ink: '#1a1f2b',
  ink2: '#4a5161',
  rule: '#dcd3bf',
  accent: '#d9581d',
  marker: '#ffe27a',
  grade: { 10: '#0f7f6f', 11: '#4352c8', 12: '#b8325f' } as Record<number, string>,
};

const FONT_DIR = path.join(process.cwd(), 'scripts', 'og-fonts');
let fonts: { name: string; data: Buffer; weight: 500 | 600 | 800; style: 'normal' }[] | null = null;
function loadFonts() {
  if (!fonts) {
    const f = (file: string) => fs.readFileSync(path.join(FONT_DIR, file));
    fonts = [
      { name: 'BVP', data: f('BeVietnamPro-Medium.ttf'), weight: 500, style: 'normal' },
      { name: 'BVP', data: f('BeVietnamPro-SemiBold.ttf'), weight: 600, style: 'normal' },
      { name: 'BVP', data: f('BeVietnamPro-ExtraBold.ttf'), weight: 800, style: 'normal' },
    ];
  }
  return fonts;
}

type Style = Record<string, string | number>;
interface Node {
  type: string;
  props: { style?: Style; children?: unknown; [k: string]: unknown };
}
const h = (type: string, style: Style, children?: unknown, extra: Record<string, unknown> = {}): Node => ({ type, props: { style, children, ...extra } });

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function titleSize(title: string): number {
  if (title.length > 64) return 50;
  if (title.length > 40) return 58;
  if (title.length > 24) return 68;
  return 84;
}

/** Biểu tượng thương hiệu: tuyến zíc zắc ba màu (giống logo trên đầu trang). */
const BRAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><path d="M5 9h17a5 5 0 0 1 0 10H12a5 5 0 0 0 0 10h17" fill="none" stroke="${C.grade[10]}" stroke-width="4" stroke-linecap="round"/><path d="M22 19H12" stroke="${C.grade[11]}" stroke-width="4"/><path d="M12 29h17" stroke="${C.grade[12]}" stroke-width="4" stroke-linecap="round"/><circle cx="5" cy="9" r="3.6" fill="${C.card}" stroke="${C.ink}" stroke-width="2"/><circle cx="29" cy="29" r="3.6" fill="${C.accent}" stroke="${C.ink}" stroke-width="2"/></svg>`;

function cardTree(card: OgCard): Node {
  const line = card.grade ? C.grade[card.grade] : C.accent;
  // trang chung (không thuộc khối nào) vẽ hình bằng màu tuyến 11 để khác màu nhấn
  const artLine = card.grade ? line : C.grade[11];
  const art = card.topicId ? topicArtSvg(card.topicId, { ink: C.ink, paper: C.card, line: artLine, accent: C.accent }) : null;

  const left = h('div', { display: 'flex', flexDirection: 'column', flex: 1, paddingRight: art ? 40 : 0 }, [
    h('div', { fontSize: 24, fontWeight: 600, letterSpacing: 3, color: C.accent, textTransform: 'uppercase', marginBottom: 16 }, card.kicker),
    h('div', { fontSize: titleSize(card.title), fontWeight: 800, lineHeight: 1.08, color: C.ink, letterSpacing: -1.5 }, card.title),
    card.subtitle ? h('div', { fontSize: 25, fontWeight: 500, lineHeight: 1.4, color: C.ink2, marginTop: 18 }, card.subtitle) : null,
    card.tags?.length
      ? h(
          'div',
          { display: 'flex', gap: 12, marginTop: 20 },
          card.tags.map((t) => h('div', { fontSize: 20, fontWeight: 600, padding: '6px 14px', borderRadius: 999, border: `2.5px solid ${C.ink}`, background: C.card, color: C.ink }, t)),
        )
      : null,
  ].filter(Boolean));

  const right = art
    ? h('div', { display: 'flex', flexShrink: 0, width: 372, height: 264, padding: 20, background: C.card, border: `3px solid ${C.ink}`, borderRadius: 28, boxShadow: `12px 12px 0 ${line}` }, [
        h('img', {}, undefined, { src: svgDataUri(art), width: 332, height: 221 }),
      ])
    : null;

  const footer = h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `2.5px solid ${C.ink}`, paddingTop: 20 }, [
    h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
      h('img', {}, undefined, { src: svgDataUri(BRAND_SVG), width: 52, height: 52 }),
      h('div', { fontSize: 30, fontWeight: 800, color: C.ink }, 'Giáo dục AI'),
    ]),
    h('div', { display: 'flex', gap: 18, alignItems: 'center' }, [10, 11, 12].map((g) =>
      h('div', { display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 600, color: C.ink2 }, [
        h('div', { width: 18, height: 18, borderRadius: 999, border: `4px solid ${C.grade[g]}`, background: card.grade === g ? C.grade[g] : C.card }),
        `Lớp ${g}`,
      ]),
    )),
  ]);

  return h(
    'div',
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '52px 72px 44px 88px',
      background: C.paper,
      backgroundImage: `linear-gradient(${C.rule}55 1px, transparent 1px), linear-gradient(90deg, ${C.rule}55 1px, transparent 1px)`,
      backgroundSize: '36px 36px',
      borderLeft: `20px solid ${line}`,
      fontFamily: 'BVP',
    },
    [h('div', { display: 'flex', alignItems: 'center', flex: 1, paddingBottom: 32 }, [left, right].filter(Boolean)), footer],
  );
}

export async function renderOg(card: OgCard): Promise<ArrayBuffer> {
  // satori nhận cây phần tử dạng React; Node ở đây có đúng hình dạng đó
  const svg = await satori(cardTree(card) as unknown as Parameters<typeof satori>[0], { ...OG_SIZE, fonts: loadFonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_SIZE.width } }).render().asPng();
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}
