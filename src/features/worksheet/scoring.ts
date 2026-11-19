import type { Answers, Mastery, ObjectiveResult, Question, QuestionResult, Worksheet, WorksheetResult } from './types';

const BLANK = /\[\[(.+?)\]\]/g;

export function blanksOf(ws: Worksheet): string[] {
  return ws.summary.lines.flatMap((line) => [...line.matchAll(BLANK)].map((m) => m[1]));
}

/** Ngân hàng từ: đáp án + từ nhiễu, bỏ trùng, sắp theo thứ tự tiếng Việt (ổn định để mã hóa chỉ số). */
export function wordBank(ws: Worksheet): string[] {
  return [...new Set([...blanksOf(ws), ...ws.summary.distractors])].sort((a, b) => a.localeCompare(b, 'vi'));
}

export function emptyAnswers(ws: Worksheet): Answers {
  return {
    summary: blanksOf(ws).map(() => null),
    questions: ws.questions.map(() => null),
    applyText: '',
    applyLevel: 0,
    confidence: ws.objectives.map(() => 0),
    doubts: '',
    aiUse: '',
  };
}

const isIndexArray = (v: unknown, len: number): v is number[] =>
  Array.isArray(v) && v.length === len && v.every((x) => Number.isInteger(x));

export function isAnswered(q: Question, a: Answers['questions'][number]): boolean {
  switch (q.type) {
    case 'single':
    case 'truefalse':
      return Number.isInteger(a);
    case 'order':
      return isIndexArray(a, q.items.length);
    case 'classify':
      return isIndexArray(a, q.items.length);
  }
}

function scoreQuestion(q: Question, a: Answers['questions'][number]): QuestionResult {
  const answered = isAnswered(q, a);
  const base = { id: q.id, answered };
  if (!answered) return { ...base, correct: false, misconceptions: [] };
  switch (q.type) {
    case 'single': {
      const opt = q.options[a as number];
      const correct = Boolean(opt?.correct);
      return { ...base, correct, misconceptions: !correct && opt?.misconception ? [opt.misconception] : [] };
    }
    case 'truefalse': {
      const correct = (a === 1) === q.answer;
      return { ...base, correct, misconceptions: !correct && q.misconception ? [q.misconception] : [] };
    }
    case 'order': {
      const correct = (a as number[]).every((v, i) => v === i);
      return { ...base, correct, misconceptions: !correct && q.misconception ? [q.misconception] : [] };
    }
    case 'classify': {
      const picks = a as number[];
      const wrong = q.items.filter((it, i) => picks[i] !== it.category);
      return {
        ...base,
        correct: wrong.length === 0,
        misconceptions: wrong.map((it) => it.misconception ?? `Xếp nhầm “${it.text}”`),
      };
    }
  }
}

function masteryOf(correct: number, total: number, needsApply: boolean, applyLevel: number): Mastery {
  if (total === 0) return 'chua-dat';
  if (correct === total && (!needsApply || applyLevel === 3)) return 'tot';
  return correct / total >= 0.5 ? 'dat' : 'chua-dat';
}

export function scoreWorksheet(ws: Worksheet, answers: Answers): WorksheetResult {
  const bank = wordBank(ws);
  const blanks = blanksOf(ws);
  const summaryCorrect = blanks.filter((b, i) => {
    const pick = answers.summary[i];
    return Number.isInteger(pick) && bank[pick as number] === b;
  }).length;

  const questions = ws.questions.map((q, i) => scoreQuestion(q, answers.questions[i] ?? null));

  const objectives: ObjectiveResult[] = ws.objectives.map((o, idx) => {
    const own = ws.questions.map((q, i) => ({ q, r: questions[i] })).filter((x) => x.q.objective === o.id);
    const correct = own.filter((x) => x.r.correct).length;
    const conf = answers.confidence[idx];
    return {
      id: o.id,
      correct,
      total: own.length,
      mastery: masteryOf(correct, own.length, ws.apply.objective === o.id, answers.applyLevel),
      confidence: Number.isInteger(conf) ? conf : 0,
    };
  });

  return { summary: { correct: summaryCorrect, total: blanks.length }, questions, objectives };
}

/** Kiểm tra một phiếu soạn đúng quy tắc biên soạn; trả về danh sách lỗi (rỗng nếu hợp lệ). */
export function validateWorksheet(ws: Worksheet): string[] {
  const errors: string[] = [];
  const ids = new Set(ws.objectives.map((o) => o.id));
  if (blanksOf(ws).length === 0) errors.push('Phần tổng hợp chưa có chỗ trống [[...]]');
  for (const o of ws.objectives) {
    if (!ws.questions.some((q) => q.objective === o.id)) errors.push(`Mục tiêu ${o.id} chưa có câu hỏi`);
  }
  if (!ws.questions.some((q) => q.level === 'van-dung')) errors.push('Thiếu câu mức Vận dụng');
  const qids = new Set<string>();
  for (const q of ws.questions) {
    if (qids.has(q.id)) errors.push(`Trùng mã câu ${q.id}`);
    qids.add(q.id);
    if (!ids.has(q.objective)) errors.push(`Câu ${q.id} gắn mục tiêu không tồn tại: ${q.objective}`);
    if (q.type === 'single' && q.options.filter((o) => o.correct).length !== 1) errors.push(`Câu ${q.id} phải có đúng một phương án đúng`);
    if (q.type === 'order' && q.items.length < 3) errors.push(`Câu ${q.id} cần ít nhất 3 mục để sắp xếp`);
    if (q.type === 'classify' && q.items.some((it) => it.category < 0 || it.category >= q.categories.length)) {
      errors.push(`Câu ${q.id} có mục xếp vào nhóm không tồn tại`);
    }
  }
  if (!ids.has(ws.apply.objective)) errors.push('Phần vận dụng gắn mục tiêu không tồn tại');
  return errors;
}

/** Xáo trộn ổn định theo chuỗi hạt giống (để thứ tự hiển thị giống nhau trên mọi máy). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
