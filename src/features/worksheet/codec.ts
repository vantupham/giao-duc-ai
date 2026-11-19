// Mã hóa kết quả phiếu học tập thành chuỗi ngắn để tạo mã QR (không cần máy chủ).
// JSON gọn → nén deflate → Base45 (RFC 9285, dùng chế độ chữ-số của QR nên mã nhỏ hơn).
import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';
import type { Answers } from './types';

const PREFIX = 'GDAI1:';
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export const LIMITS = { name: 40, className: 12, applyText: 240, doubts: 160, aiUse: 100 } as const;

export interface Submission {
  slug: string;
  version: number;
  className: string;
  studentNo: number;
  name: string;
  /** Ngày làm phiếu dạng YYYYMMDD. */
  date: number;
  answers: Answers;
}

export type DecodeResult = { ok: true; data: Submission } | { ok: false; error: string };

export function base45Encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      let n = bytes[i] * 256 + bytes[i + 1];
      const c = n % 45;
      n = (n - c) / 45;
      out += ALPHABET[c] + ALPHABET[n % 45] + ALPHABET[Math.floor(n / 45)];
    } else {
      const n = bytes[i];
      out += ALPHABET[n % 45] + ALPHABET[Math.floor(n / 45)];
    }
  }
  return out;
}

export function base45Decode(text: string): Uint8Array {
  const vals = [...text].map((ch) => {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error(`Kí tự không hợp lệ: ${ch}`);
    return v;
  });
  if (vals.length % 3 === 1) throw new Error('Độ dài mã không hợp lệ');
  const out: number[] = [];
  for (let i = 0; i < vals.length; i += 3) {
    if (i + 2 < vals.length) {
      const n = vals[i] + vals[i + 1] * 45 + vals[i + 2] * 2025;
      if (n > 0xffff) throw new Error('Giá trị vượt giới hạn');
      out.push(n >> 8, n & 0xff);
    } else {
      const n = vals[i] + vals[i + 1] * 45;
      if (n > 0xff) throw new Error('Giá trị vượt giới hạn');
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}

const clip = (s: string, n: number) => [...(s ?? '')].slice(0, n).join('').trim();

export function encodeSubmission(s: Submission): string {
  const a = s.answers;
  const compact = {
    v: 1,
    w: s.slug,
    x: s.version,
    c: clip(s.className, LIMITS.className),
    s: s.studentNo,
    n: clip(s.name, LIMITS.name),
    d: s.date,
    b: a.summary,
    a: a.questions,
    r: a.applyLevel,
    k: a.confidence,
    t: clip(a.applyText, LIMITS.applyText),
    e: clip(a.doubts, LIMITS.doubts),
    u: clip(a.aiUse, LIMITS.aiUse),
  };
  return PREFIX + base45Encode(deflateSync(strToU8(JSON.stringify(compact)), { level: 9 }));
}

const isInt = (v: unknown): v is number => Number.isInteger(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isAnswerItem = (v: unknown) => v === null || isInt(v) || (Array.isArray(v) && v.every(isInt));

function parseCompact(raw: unknown): Submission | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const ok =
    o.v === 1 &&
    isStr(o.w) &&
    isInt(o.x) &&
    isStr(o.c) &&
    isInt(o.s) &&
    isStr(o.n) &&
    isInt(o.d) &&
    Array.isArray(o.b) &&
    o.b.every((x) => x === null || isInt(x)) &&
    Array.isArray(o.a) &&
    o.a.every(isAnswerItem) &&
    isInt(o.r) &&
    Array.isArray(o.k) &&
    o.k.every(isInt) &&
    isStr(o.t) &&
    isStr(o.e) &&
    isStr(o.u);
  if (!ok) return null;
  return {
    slug: o.w as string,
    version: o.x as number,
    className: o.c as string,
    studentNo: o.s as number,
    name: o.n as string,
    date: o.d as number,
    answers: {
      summary: o.b as (number | null)[],
      questions: o.a as Answers['questions'],
      applyLevel: o.r as number,
      confidence: o.k as number[],
      applyText: o.t as string,
      doubts: o.e as string,
      aiUse: o.u as string,
    },
  };
}

export function decodeSubmission(code: string): DecodeResult {
  const text = code.trim();
  if (!text.startsWith(PREFIX)) return { ok: false, error: 'Mã QR này không phải phiếu học tập của website.' };
  try {
    const json = strFromU8(inflateSync(base45Decode(text.slice(PREFIX.length))));
    const data = parseCompact(JSON.parse(json));
    return data ? { ok: true, data } : { ok: false, error: 'Mã phiếu bị thiếu hoặc sai dữ liệu.' };
  } catch {
    return { ok: false, error: 'Không đọc được mã phiếu (mã bị hỏng hoặc quét chưa trọn).' };
  }
}
