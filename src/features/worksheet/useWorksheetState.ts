// Trạng thái dùng chung của phiếu học tập (bản một trang và bản từng bước): bài làm, thông tin học sinh, nộp, mã QR.

import { useEffect, useMemo, useState } from 'react';
import type { Answers, Worksheet, WorksheetResult } from './types';
import { emptyAnswers, scoreWorksheet } from './scoring';
import { encodeSubmission } from './codec';
import { loadJson, saveJson, isObject } from '../../lib/storage';

export interface StudentInfo {
  className: string;
  studentNo: string;
  name: string;
}

interface Draft {
  answers: Answers;
  submitted: boolean;
  date: number;
}

export const STUDENT_KEY = 'gdai.student';
const EMPTY_STUDENT: StudentInfo = { className: '', studentNo: '', name: '' };
const isStudent = (v: unknown): v is StudentInfo => isObject(v) && typeof v.className === 'string' && typeof v.name === 'string';
const isDraft = (v: unknown): v is Draft => isObject(v) && isObject(v.answers) && typeof v.submitted === 'boolean';

export const today = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const draftKeyOf = (ws: Worksheet): string => `gdai.ws.${ws.slug}.v${ws.version}`;

export interface WorksheetState {
  student: StudentInfo;
  answers: Answers;
  submitted: boolean;
  result: WorksheetResult | null;
  code: string;
  missing: number;
  update: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  updateStudent: (key: keyof StudentInfo, value: string) => void;
  /** Trả về thông báo lỗi nếu chưa nộp được, null nếu đã nộp. */
  submit: () => string | null;
  retry: () => void;
}

export function useWorksheetState(ws: Worksheet): WorksheetState {
  const draftKey = draftKeyOf(ws);
  const [student, setStudent] = useState<StudentInfo>(EMPTY_STUDENT);
  const [answers, setAnswers] = useState<Answers>(() => emptyAnswers(ws));
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState(today);

  useEffect(() => {
    setStudent(loadJson(STUDENT_KEY, EMPTY_STUDENT, isStudent));
    const d = loadJson<Draft | null>(draftKey, null, (v): v is Draft => isDraft(v));
    if (d && d.answers.questions.length === ws.questions.length) {
      setAnswers(d.answers);
      setSubmitted(d.submitted);
      setDate(d.date ?? today());
    }
  }, [draftKey, ws.questions.length]);

  useEffect(() => {
    saveJson(draftKey, { answers, submitted, date });
  }, [draftKey, answers, submitted, date]);

  const result = useMemo(() => (submitted ? scoreWorksheet(ws, answers) : null), [submitted, ws, answers]);
  const code = useMemo(
    () =>
      submitted
        ? encodeSubmission({ slug: ws.slug, version: ws.version, className: student.className, studentNo: Number(student.studentNo) || 0, name: student.name, date, answers })
        : '',
    [submitted, ws, student, date, answers],
  );

  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));
  const updateStudent = (key: keyof StudentInfo, value: string) => {
    const next = { ...student, [key]: value };
    setStudent(next);
    saveJson(STUDENT_KEY, next);
  };

  const submit = (): string | null => {
    if (!student.className.trim() || !student.studentNo.trim()) return 'Em hãy điền lớp và số thứ tự để thầy cô nhận được phiếu.';
    setDate(today());
    setSubmitted(true);
    return null;
  };

  const retry = () => {
    setSubmitted(false);
    setAnswers(emptyAnswers(ws));
  };

  const missing = answers.questions.filter((a) => a === null).length;
  return { student, answers, submitted, result, code, missing, update, updateStudent, submit, retry };
}
