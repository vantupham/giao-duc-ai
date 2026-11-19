// Tổng hợp kết quả phiếu học tập của một lớp – chạy trên máy giáo viên, không cần máy chủ.
import type { Submission } from '../worksheet/codec';
import type { Mastery, Worksheet, WorksheetResult } from '../worksheet/types';
import { MASTERY_LABEL } from '../worksheet/types';
import { scoreWorksheet } from '../worksheet/scoring';

export interface StoredSubmission extends Submission {
  receivedAt: number;
}

export type Store = Record<string, StoredSubmission>;

export const submissionKey = (s: Pick<Submission, 'className' | 'slug' | 'studentNo'>) => `${s.className.trim().toUpperCase()}|${s.slug}|${s.studentNo}`;

export function upsert(store: Readonly<Store>, s: StoredSubmission): Store {
  return { ...store, [submissionKey(s)]: s };
}

export interface StudentRow {
  sub: StoredSubmission;
  result: WorksheetResult;
}

export interface Aggregate {
  students: StudentRow[];
  objectives: ({ id: string } & Record<Mastery, number>)[];
  questions: { id: string; correctRate: number; answeredRate: number }[];
  misconceptions: { text: string; count: number; questionId: string }[];
  overconfident: { studentNo: number; name: string; objective: string }[];
  doubts: { studentNo: number; text: string }[];
}

export function aggregate(ws: Worksheet, subs: readonly StoredSubmission[]): Aggregate {
  const students = [...subs].sort((a, b) => a.studentNo - b.studentNo).map((sub) => ({ sub, result: scoreWorksheet(ws, sub.answers) }));
  const n = students.length || 1;

  const objectives = ws.objectives.map((o) => {
    const counts: Record<Mastery, number> = { tot: 0, dat: 0, 'chua-dat': 0 };
    for (const s of students) {
      const r = s.result.objectives.find((x) => x.id === o.id);
      if (r) counts[r.mastery] += 1;
    }
    return { id: o.id, ...counts };
  });

  const questions = ws.questions.map((q, i) => ({
    id: q.id,
    correctRate: students.filter((s) => s.result.questions[i].correct).length / n,
    answeredRate: students.filter((s) => s.result.questions[i].answered).length / n,
  }));

  const mis = new Map<string, { text: string; count: number; questionId: string }>();
  for (const s of students) {
    for (const qr of s.result.questions) {
      for (const text of new Set(qr.misconceptions)) {
        const key = `${qr.id}|${text}`;
        const cur = mis.get(key) ?? { text, count: 0, questionId: qr.id };
        mis.set(key, { ...cur, count: cur.count + 1 });
      }
    }
  }
  const misconceptions = [...mis.values()].sort((a, b) => b.count - a.count || a.questionId.localeCompare(b.questionId));

  const overconfident = students.flatMap((s) =>
    s.result.objectives.filter((o) => o.mastery === 'chua-dat' && o.confidence >= 3).map((o) => ({ studentNo: s.sub.studentNo, name: s.sub.name, objective: o.id })),
  );

  const doubts = students.filter((s) => s.sub.answers.doubts.trim()).map((s) => ({ studentNo: s.sub.studentNo, text: s.sub.answers.doubts.trim() }));

  return { students, objectives, questions, misconceptions, overconfident, doubts };
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) || /[^\x20-\x7e]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(ws: Worksheet, agg: Aggregate): string {
  const head = [
    'Lớp',
    'Số TT',
    'Tên',
    'Ngày',
    'Tổng hợp',
    ...ws.objectives.flatMap((o) => [`${o.id} mức đạt`, `${o.id} tự tin`]),
    ...ws.questions.map((q) => `${q.id} đúng`),
    'Vận dụng (tự đánh giá)',
    'Câu trả lời vận dụng',
    'Băn khoăn',
    'Dùng AI',
  ];
  const rows = agg.students.map(({ sub, result }) => [
    sub.className,
    sub.studentNo,
    sub.name,
    sub.date,
    `${result.summary.correct}/${result.summary.total}`,
    ...result.objectives.flatMap((o) => [MASTERY_LABEL[o.mastery], o.confidence || '']),
    ...result.questions.map((q) => (q.correct ? 1 : 0)),
    sub.answers.applyLevel || '',
    sub.answers.applyText,
    sub.answers.doubts,
    sub.answers.aiUse,
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
