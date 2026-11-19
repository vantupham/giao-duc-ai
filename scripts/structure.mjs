// Chuyển danh sách khối phẳng (docx-reader) thành cấu trúc khối lớp → chuyên đề → bài → mục.

const BOX_LABELS = [
  { kind: 'concept', re: /^Khái niệm$/ },
  { kind: 'pitfall', re: /^Dễ nhầm$/ },
  { kind: 'story', re: /^Câu chuyện có thật$/ },
  { kind: 'didyouknow', re: /^Em có biết\??$/ },
  { kind: 'activity', re: /^Hoạt động \d+\./ },
];

const SECTION_KINDS = [
  { kind: 'objectives', re: /^Sau bài học này/ },
  { kind: 'warmup', re: /^Khởi động/ },
  { kind: 'recall', re: /^Nhắc lại/ },
  { kind: 'experience', re: /^Trải nghiệm/ },
  { kind: 'remember', re: /^Ghi nhớ/ },
  { kind: 'practice', re: /^Luyện tập/ },
  { kind: 'apply', re: /^Vận dụng/ },
  { kind: 'selfcheck', re: /^Tự đánh giá/ },
  { kind: 'glossary', re: /^Thuật ngữ/ },
  { kind: 'answers', re: /^Gợi ý trả lời/ },
];

const PAGE_HEADER = /^GIÁO DỤC TRÍ TUỆ NHÂN TẠO · LỚP \d+$/;
const LESSON_HEADING = /^Bài (\d+)\.(\d+)\.\s*(.+)$/;

export const lessonSlug = (grade, num) => `bai-${grade}-${String(num).padStart(2, '0')}`;

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const isNoise = (b) => b.type === 'p' && !b.images && (PAGE_HEADER.test(b.text) || /^\d{1,3}$/.test(b.text));

const cleanInlines = (inl) => inl.map(({ text, b, i, href }) => ({ text, ...(b && { b }), ...(i && { i }), ...(href && { href }) }));

function mediaPath(grade, target) {
  return `media/k${grade}/${target.split('/').pop()}`;
}

function cellBlocks(paras, grade) {
  return groupLists(paras.map((p) => ({ type: 'p', ...p })), grade);
}

function convertTable(rows, grade) {
  const conv = rows.map((r) => r.map((cell) => cellBlocks(cell, grade)));
  return { t: 'table', head: conv[0], rows: conv.slice(1) };
}

// Gom các đoạn danh sách liên tiếp; chuyển đoạn thường, hình, bảng.
function groupLists(blocks, grade) {
  const out = [];
  for (const b of blocks) {
    if (b.type === 'table') {
      out.push(convertTable(b.rows, grade));
      continue;
    }
    if (b.images?.length) {
      for (const img of b.images) out.push({ t: 'figure', src: mediaPath(grade, img), caption: null });
      if (!b.text) continue;
    }
    if (b.style === 'ImageCaption') {
      const fig = out[out.length - 1];
      if (fig?.t === 'figure' && !fig.caption) fig.caption = b.text;
      else out.push({ t: 'p', inl: cleanInlines(b.inlines), cls: 'caption' });
      continue;
    }
    if (b.style === 'Heading3') {
      out.push({ t: 'h3', text: b.text, id: slugify(b.text) });
      continue;
    }
    if (b.list) {
      const last = out[out.length - 1];
      const item = { inl: cleanInlines(b.inlines), level: b.list.level };
      if (last?.t === 'list' && last.numId === b.list.numId) last.items.push(item);
      else out.push({ t: 'list', ordered: b.list.ordered, numId: b.list.numId, items: [item] });
      continue;
    }
    const p = { t: 'p', inl: cleanInlines(b.inlines) };
    if (/^Nguồn của bài:/.test(b.text)) p.cls = 'sources';
    out.push(p);
  }
  return out.map(({ numId, ...rest }) => rest);
}

// Nhãn hộp có thể đứng riêng ("Dễ nhầm") hoặc chung dòng với nội dung ("Dễ nhầm: …", "Hoạt động 1. …").
const INLINE_LABEL = /^(Khái niệm|Dễ nhầm|Câu chuyện có thật|Em có biết\??|Hoạt động \d+)/;

function boxKindOf(text) {
  if (text.length <= 90) {
    const exact = BOX_LABELS.find((l) => l.re.test(text))?.kind;
    if (exact) return { kind: exact, inline: false };
  }
  const m = text.match(INLINE_LABEL);
  if (!m) return null;
  const kind = BOX_LABELS.find((l) => l.re.test(m[1]) || (l.kind === 'activity' && /^Hoạt động/.test(m[1])))?.kind;
  return kind ? { kind, inline: true } : null;
}

// Tách phần tiêu đề in đậm ở đầu đoạn ra khỏi phần nội dung.
function splitLeadingBold(block) {
  const inl = block.inlines;
  let k = 0;
  let title = '';
  while (k < inl.length && inl[k].b) title += inl[k++].text;
  const rest = inl.slice(k);
  const restText = rest.map((x) => x.text).join('').trim();
  return {
    title: title.trim().replace(/[:.]$/, '') || block.text.match(INLINE_LABEL)[1],
    body: restText ? { ...block, inlines: rest.map((x, j) => (j === 0 ? { ...x, text: x.text.replace(/^\s+/, '') } : x)), text: restText } : null,
  };
}

// Gom các đoạn BlockText liên tiếp thành hộp, tách hộp khi gặp nhãn mới.
function groupBoxes(blocks, sectionKind) {
  const out = [];
  let box = null;
  const flush = () => {
    if (box) out.push(box);
    box = null;
  };
  for (const b of blocks) {
    const isBlockText = b.type === 'p' && b.style === 'BlockText';
    if (!isBlockText) {
      flush();
      out.push(b);
      continue;
    }
    if (b.text.startsWith('?')) {
      flush();
      out.push({ ...b, boxKind: 'question', boxTitle: null });
      continue;
    }
    const label = boxKindOf(b.text);
    if (label && !label.inline) {
      flush();
      box = { boxKind: label.kind, title: b.text, items: [] };
      continue;
    }
    if (label?.inline) {
      flush();
      const { title, body } = splitLeadingBold(b);
      box = { boxKind: label.kind, title, items: body ? [body] : [] };
      continue;
    }
    if (!box) box = { boxKind: sectionKind === 'experience' ? 'tool' : 'note', title: null, items: [] };
    box.items.push(b);
  }
  flush();
  return out;
}

function convertSectionBlocks(rawBlocks, grade, sectionKind) {
  const grouped = groupBoxes(rawBlocks, sectionKind);
  const out = [];
  let pending = [];
  const flushPending = () => {
    out.push(...groupLists(pending, grade));
    pending = [];
  };
  for (const g of grouped) {
    if (g.boxKind === 'question') {
      flushPending();
      out.push({ t: 'question', inl: cleanInlines(g.inlines).map((x, i) => (i === 0 ? { ...x, text: x.text.replace(/^\?\s*/, '') } : x)).filter((x) => x.text) });
    } else if (g.boxKind) {
      flushPending();
      out.push({ t: 'box', kind: g.boxKind, title: g.title, blocks: groupLists(g.items, grade) });
    } else pending.push(g);
  }
  flushPending();
  return out;
}

function buildLesson(grade, match, blocks, topicId) {
  const [, , num, title] = match;
  const sections = [];
  let meta = null;
  let current = { title: null, kind: 'intro', raw: [] };
  for (const b of blocks) {
    if (b.type === 'p' && b.style === 'Heading2') {
      sections.push(current);
      const kind = SECTION_KINDS.find((k) => k.re.test(b.text))?.kind ?? 'content';
      current = { title: b.text, kind, raw: [] };
      continue;
    }
    if (!meta && current.kind === 'intro' && b.type === 'p' && /^Chuyên đề/.test(b.text)) {
      meta = b.text;
      continue;
    }
    current.raw.push(b);
  }
  sections.push(current);

  let objectives = [];
  let keywords = [];
  const outSections = [];
  for (const s of sections) {
    if (s.kind === 'intro' && s.raw.length === 0) continue;
    if (s.kind === 'objectives') {
      for (const b of s.raw) {
        if (b.list) objectives.push(cleanInlines(b.inlines));
        else if (/^Từ khóa của bài:/.test(b.text)) {
          keywords = b.text.replace(/^Từ khóa của bài:\s*/, '').replace(/\.$/, '').split(/,\s*/);
        }
      }
      continue;
    }
    outSections.push({
      id: slugify(s.title ?? 'mo-dau'),
      title: s.title,
      kind: s.kind,
      blocks: convertSectionBlocks(s.raw, grade, s.kind),
    });
  }
  const periodMatch = meta?.match(/tiết (\d+) trong (\d+) tiết/);
  return {
    id: `${grade}.${num}`,
    slug: lessonSlug(grade, num),
    grade,
    num: Number(num),
    topicId,
    title: title.trim(),
    meta,
    period: periodMatch ? { index: Number(periodMatch[1]), total: Number(periodMatch[2]) } : null,
    objectives,
    keywords,
    sections: outSections,
  };
}

function buildTopic(grade, tableBlock, introBlocks) {
  const cells = tableBlock.rows[0].flat().map((p) => p.text);
  const label = cells.find((t) => /^CHUYÊN ĐỀ/.test(t));
  const idx = cells.indexOf(label);
  const id = label.replace('CHUYÊN ĐỀ', '').trim();
  const title = cells[idx + 1];
  const info = cells[idx + 2] ?? '';
  const texts = introBlocks.filter((b) => b.type === 'p').map((b) => b.text);
  const outcomesStart = texts.findIndex((t) => /^HỌC XONG CHUYÊN ĐỀ/.test(t));
  const outcomes = outcomesStart >= 0 ? texts.slice(outcomesStart + 1).map((t) => t.replace(/^■\s*/, '')) : [];
  let guidingQuestion = null;
  const lessonBlurbs = {};
  for (const b of introBlocks.filter((x) => x.type === 'table')) {
    for (const row of b.rows) {
      const cells = row.map((c) => c.map((p) => p.text));
      const flat = cells.flat();
      if (flat[0] === 'CÂU HỎI DẪN ĐƯỜNG') guidingQuestion = flat[1] ?? null;
      const m = flat[0]?.match(/^Bài (\d+\.\d+)$/);
      if (m) lessonBlurbs[m[1]] = flat[2] ?? '';
    }
  }
  return {
    id,
    grade,
    title,
    info,
    description: texts[0] ?? '',
    guidingQuestion,
    outcomes,
    lessonBlurbs,
  };
}

function buildSources(blocks) {
  const sources = [];
  let group = null;
  for (const b of blocks) {
    if (b.type !== 'p') continue;
    const m = b.text.match(/^\[(\d+)\]\s*/);
    if (m) {
      const inl = cleanInlines(b.inlines);
      inl[0] = { ...inl[0], text: inl[0].text.replace(/^\[\d+\]\s*/, '') };
      sources.push({ n: Number(m[1]), group, inl: inl.filter((x) => x.text) });
    } else group = b.text;
  }
  return sources;
}

export function structureGrade(grade, flatBlocks) {
  const blocks = flatBlocks.filter((b) => !isNoise(b));
  const topics = [];
  const lessons = [];
  let sources = [];
  let i = 0;
  let currentTopic = null;
  while (i < blocks.length) {
    const b = blocks[i];
    const isTopicBanner = b.type === 'table' && b.rows.length === 1 && b.rows[0].flat().some((p) => /^CHUYÊN ĐỀ \d+\.\d+$/.test(p.text));
    const isH1 = b.type === 'p' && b.style === 'Heading1';
    if (isTopicBanner) {
      let j = i + 1;
      while (j < blocks.length && !(blocks[j].type === 'p' && blocks[j].style === 'Heading1')) j++;
      currentTopic = buildTopic(grade, b, blocks.slice(i + 1, j));
      topics.push(currentTopic);
      i = j;
      continue;
    }
    if (isH1) {
      let j = i + 1;
      while (j < blocks.length) {
        const n = blocks[j];
        const nextH1 = n.type === 'p' && n.style === 'Heading1';
        const nextBanner = n.type === 'table' && n.rows.length === 1 && n.rows[0].flat().some((p) => /^CHUYÊN ĐỀ \d+\.\d+$/.test(p.text));
        if (nextH1 || nextBanner) break;
        j++;
      }
      const m = b.text.match(LESSON_HEADING);
      if (m) lessons.push(buildLesson(grade, m, blocks.slice(i + 1, j), currentTopic?.id ?? null));
      else if (/^Nguồn tham khảo/.test(b.text)) sources = buildSources(blocks.slice(i + 1, j));
      i = j;
      continue;
    }
    i++;
  }
  return { grade, topics, lessons, sources };
}
