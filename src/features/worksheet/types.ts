// Kiểu dữ liệu của phiếu học tập cuối bài (xem KE-HOACH-WEBSITE-GIAO-DUC-AI.md, mục 6A).

export type Level = 'nhan-biet' | 'thong-hieu' | 'van-dung';

export const LEVEL_LABEL: Record<Level, string> = {
  'nhan-biet': 'Nhận biết',
  'thong-hieu': 'Thông hiểu',
  'van-dung': 'Vận dụng',
};

interface BaseQuestion {
  id: string;
  objective: string;
  level: Level;
  prompt: string;
  explanation: string;
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single';
  options: { text: string; correct?: boolean; misconception?: string }[];
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'truefalse';
  answer: boolean;
  misconception?: string;
}

/** items liệt kê theo thứ tự ĐÚNG; giao diện tự xáo trộn. */
export interface OrderQuestion extends BaseQuestion {
  type: 'order';
  items: string[];
  misconception?: string;
}

export interface ClassifyQuestion extends BaseQuestion {
  type: 'classify';
  categories: string[];
  items: { text: string; category: number; misconception?: string }[];
}

export type Question = SingleQuestion | TrueFalseQuestion | OrderQuestion | ClassifyQuestion;

export interface Worksheet {
  slug: string;
  lessonId: string;
  title: string;
  version: number;
  objectives: { id: string; text: string }[];
  /** Mỗi dòng chứa chỗ trống dạng [[đáp án]]. */
  summary: { title: string; lines: string[]; distractors: string[] };
  questions: Question[];
  apply: { objective: string; prompt: string; rubric: [string, string, string]; hint?: string };
}

/** Câu trả lời của học sinh. Mỗi phần tử questions ứng với một câu theo thứ tự trong phiếu. */
export interface Answers {
  /** Chỉ số từ trong ngân hàng từ cho từng chỗ trống. */
  summary: (number | null)[];
  /** single: chỉ số phương án · truefalse: 1 = Đúng, 0 = Sai · order: thứ tự chỉ số mục · classify: nhóm của từng mục. */
  questions: (number | number[] | null)[];
  applyText: string;
  /** Học sinh tự đối chiếu tiêu chí: 0 = chưa làm, 1–3 = mức. */
  applyLevel: number;
  /** Mức tự tin 1–4 cho từng mục tiêu, 0 = chưa chọn. */
  confidence: number[];
  doubts: string;
  aiUse: string;
}

export type Mastery = 'chua-dat' | 'dat' | 'tot';

export const MASTERY_LABEL: Record<Mastery, string> = {
  'chua-dat': 'Chưa đạt',
  dat: 'Đạt',
  tot: 'Tốt',
};

export interface QuestionResult {
  id: string;
  correct: boolean;
  answered: boolean;
  misconceptions: string[];
}

export interface ObjectiveResult {
  id: string;
  correct: number;
  total: number;
  mastery: Mastery;
  confidence: number;
}

export interface WorksheetResult {
  summary: { correct: number; total: number };
  questions: QuestionResult[];
  objectives: ObjectiveResult[];
}
