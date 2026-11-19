// Kiểu dữ liệu nội dung do scripts/convert-docx.mjs sinh ra.

export interface Inline {
  text: string;
  b?: boolean;
  i?: boolean;
  href?: string;
}

export type Block =
  | { t: 'p'; inl: Inline[]; cls?: 'caption' | 'sources' }
  | { t: 'h3'; text: string; id: string }
  | { t: 'list'; ordered: boolean; items: { inl: Inline[]; level: number }[] }
  | { t: 'table'; head: Block[][]; rows: Block[][][] }
  | { t: 'figure'; src: string; caption: string | null }
  | { t: 'question'; inl: Inline[] }
  | { t: 'box'; kind: BoxKind; title: string | null; blocks: Block[] };

export type BoxKind = 'concept' | 'pitfall' | 'story' | 'didyouknow' | 'activity' | 'tool' | 'note';

export type SectionKind =
  | 'intro'
  | 'warmup'
  | 'recall'
  | 'content'
  | 'experience'
  | 'remember'
  | 'practice'
  | 'apply'
  | 'selfcheck'
  | 'glossary'
  | 'answers';

export interface Section {
  id: string;
  title: string | null;
  kind: SectionKind;
  blocks: Block[];
}

export interface Lesson {
  id: string;
  slug: string;
  grade: number;
  num: number;
  topicId: string | null;
  title: string;
  meta: string | null;
  period: { index: number; total: number } | null;
  objectives: Inline[][];
  keywords: string[];
  sections: Section[];
}

export interface Topic {
  id: string;
  grade: number;
  title: string;
  info: string;
  description: string;
  guidingQuestion: string | null;
  outcomes: string[];
  lessonBlurbs: Record<string, string>;
}

export interface Source {
  n: number;
  group: string | null;
  inl: Inline[];
}

export interface GradeData {
  grade: number;
  topics: Topic[];
  sources: Source[];
}

export interface TeachingInfo {
  slideCount: number;
  plan: { minutes: number; label: string }[];
  exitTicket: string[];
}
