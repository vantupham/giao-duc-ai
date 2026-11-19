// Đọc file .docx (do pandoc tạo) thành danh sách khối phẳng theo thứ tự xuất hiện.
// Không phụ thuộc pandoc: giải nén bằng fflate, phân tích XML bằng fast-xml-parser.
import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: false,
  parseTagValue: false,
});

const tagOf = (node) => Object.keys(node).find((k) => k !== ':@');
const childrenOf = (node) => node[tagOf(node)] ?? [];
const attrsOf = (node) => node[':@'] ?? {};

function findAll(nodes, tag, out = []) {
  for (const n of nodes) {
    const t = tagOf(n);
    if (t === tag) out.push(n);
    else if (t && t !== '#text' && Array.isArray(n[t])) findAll(n[t], tag, out);
  }
  return out;
}

function findFirst(nodes, tag) {
  return findAll(nodes, tag)[0];
}

function textOf(nodes) {
  let s = '';
  for (const n of nodes) {
    const t = tagOf(n);
    if (t === '#text') s += n['#text'];
    else if (Array.isArray(n[t])) s += textOf(n[t]);
  }
  return s;
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function readNumbering(xml) {
  if (!xml) return () => 'bullet';
  const doc = parser.parse(xml);
  const abstractFmt = new Map();
  for (const an of findAll(doc, 'w:abstractNum')) {
    const id = attrsOf(an)['w:abstractNumId'];
    const lvls = {};
    for (const lvl of findAll(childrenOf(an), 'w:lvl')) {
      const fmt = findFirst(childrenOf(lvl), 'w:numFmt');
      lvls[attrsOf(lvl)['w:ilvl']] = fmt ? attrsOf(fmt)['w:val'] : 'bullet';
    }
    abstractFmt.set(id, lvls);
  }
  const numToAbstract = new Map();
  for (const num of findAll(doc, 'w:num')) {
    const abs = findFirst(childrenOf(num), 'w:abstractNumId');
    if (abs) numToAbstract.set(attrsOf(num)['w:numId'], attrsOf(abs)['w:val']);
  }
  return (numId, ilvl) => abstractFmt.get(numToAbstract.get(numId))?.[ilvl] ?? 'bullet';
}

function readRels(xml) {
  const map = new Map();
  for (const r of findAll(parser.parse(xml), 'Relationship')) {
    const a = attrsOf(r);
    map.set(a.Id, { target: a.Target, external: a.TargetMode === 'External' });
  }
  return map;
}

function runProps(run) {
  const rPr = findFirst(childrenOf(run), 'w:rPr');
  if (!rPr) return { b: false, i: false };
  const kids = childrenOf(rPr);
  const on = (tag) => {
    const n = kids.find((k) => tagOf(k) === tag);
    if (!n) return false;
    const v = attrsOf(n)['w:val'];
    return v === undefined || (v !== '0' && v !== 'false');
  };
  return { b: on('w:b'), i: on('w:i') };
}

function parseInlines(pNodes, rels, href = null, out = [], images = []) {
  for (const n of pNodes) {
    const t = tagOf(n);
    if (t === 'w:r') {
      const { b, i } = runProps(n);
      for (const k of childrenOf(n)) {
        const kt = tagOf(k);
        if (kt === 'w:t') out.push({ text: decodeEntities(textOf(childrenOf(k))), b, i, href });
        else if (kt === 'w:tab') out.push({ text: ' ', b, i, href });
        else if (kt === 'w:br') out.push({ text: '\n', b, i, href });
        else if (kt === 'w:drawing') {
          const blip = findFirst(childrenOf(k), 'a:blip');
          const id = blip && attrsOf(blip)['r:embed'];
          if (id && rels.get(id)) images.push(rels.get(id).target);
        }
      }
    } else if (t === 'w:hyperlink') {
      const rid = attrsOf(n)['r:id'];
      const link = rid ? rels.get(rid)?.target : null;
      parseInlines(childrenOf(n), rels, link ?? href, out, images);
    } else if (t === 'w:smartTag' || t === 'w:ins' || t === 'w:sdt' || t === 'w:sdtContent') {
      parseInlines(childrenOf(n), rels, href, out, images);
    }
  }
  return { inlines: mergeInlines(out), images };
}

function mergeInlines(list) {
  const res = [];
  for (const it of list) {
    if (!it.text) continue;
    const last = res[res.length - 1];
    if (last && last.b === it.b && last.i === it.i && last.href === it.href) last.text += it.text;
    else res.push({ ...it });
  }
  return res;
}

function parseParagraph(p, rels, numFmt) {
  const kids = childrenOf(p);
  const pPr = kids.find((k) => tagOf(k) === 'w:pPr');
  const pPrKids = pPr ? childrenOf(pPr) : [];
  const styleNode = pPrKids.find((k) => tagOf(k) === 'w:pStyle');
  const style = styleNode ? attrsOf(styleNode)['w:val'] : 'Normal';
  const numPr = pPrKids.find((k) => tagOf(k) === 'w:numPr');
  const { inlines, images } = parseInlines(kids, rels);
  const text = inlines.map((x) => x.text).join('').trim();
  const block = { style, text, inlines };
  if (numPr) {
    const numId = attrsOf(findFirst(childrenOf(numPr), 'w:numId') ?? {})['w:val'];
    const ilvl = attrsOf(findFirst(childrenOf(numPr), 'w:ilvl') ?? {})['w:val'] ?? '0';
    if (numId && numId !== '0') {
      block.list = { numId, level: Number(ilvl), ordered: numFmt(numId, ilvl) !== 'bullet' };
    }
  }
  if (images.length) block.images = images;
  return block;
}

function parseTable(tbl, rels, numFmt) {
  const rows = [];
  for (const tr of childrenOf(tbl).filter((k) => tagOf(k) === 'w:tr')) {
    const cells = [];
    for (const tc of childrenOf(tr).filter((k) => tagOf(k) === 'w:tc')) {
      const paras = childrenOf(tc)
        .filter((k) => tagOf(k) === 'w:p')
        .map((p) => parseParagraph(p, rels, numFmt))
        .filter((b) => b.text || b.images);
      cells.push(paras);
    }
    rows.push(cells);
  }
  return rows;
}

/**
 * @returns {{ blocks: Array<object>, media: Map<string, Uint8Array> }}
 */
export function readDocx(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  const xml = (name) => (files[name] ? strFromU8(files[name]) : null);
  const rels = readRels(xml('word/_rels/document.xml.rels'));
  const numFmt = readNumbering(xml('word/numbering.xml'));
  const doc = parser.parse(xml('word/document.xml'));
  const body = childrenOf(findFirst(doc, 'w:body'));
  const blocks = [];
  for (const n of body) {
    const t = tagOf(n);
    if (t === 'w:p') {
      const b = parseParagraph(n, rels, numFmt);
      if (b.text || b.images) blocks.push({ type: 'p', ...b });
    } else if (t === 'w:tbl') {
      blocks.push({ type: 'table', rows: parseTable(n, rels, numFmt) });
    }
  }
  const media = new Map();
  for (const [name, data] of Object.entries(files)) {
    if (name.startsWith('word/media/')) media.set(name.slice('word/'.length), data);
  }
  return { blocks, media };
}
