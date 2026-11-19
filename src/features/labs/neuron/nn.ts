// Nơ-ron và mạng nơ-ron nhỏ viết thuần TypeScript, đủ nhẹ để chạy thời gian thực trên máy học sinh.

export interface NeuronOutput {
  sum: number;
  fires: boolean;
}

/** Nhân tín hiệu với trọng số, cộng lại, so với ngưỡng (đạt khi tổng ≥ ngưỡng). */
export function neuron(inputs: readonly number[], weights: readonly number[], threshold: number): NeuronOutput {
  const sum = inputs.reduce((s, x, i) => s + x * weights[i], 0);
  return { sum, fires: sum >= threshold };
}

export interface PerceptronState {
  weights: number[];
  threshold: number;
}

/**
 * Một bước "học": nếu đoán sai thì chỉnh trọng số các tín hiệu đang bật thêm/bớt 1.
 * Ngưỡng giữ cố định như trong tài liệu (chỉ chỉnh trọng số), trừ khi adjustThreshold = true.
 */
export function perceptronStep(
  state: PerceptronState,
  inputs: readonly number[],
  target: boolean,
  adjustThreshold = false,
): PerceptronState & { changed: boolean } {
  const { fires } = neuron(inputs, state.weights, state.threshold);
  if (fires === target) return { weights: [...state.weights], threshold: state.threshold, changed: false };
  const dir = target ? 1 : -1;
  return {
    weights: state.weights.map((w, i) => w + dir * inputs[i]),
    threshold: adjustThreshold ? state.threshold - dir : state.threshold,
    changed: true,
  };
}

// ---------------- Mạng nhiều lớp ----------------

export interface Net {
  sizes: number[];
  /** weights[l][j][k]: trọng số từ nơ-ron k của lớp l tới nơ-ron j của lớp l+1. */
  weights: number[][][];
  biases: number[][];
}

export interface Point {
  x: number;
  y: number;
  label: 0 | 1;
}

export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createNet(sizes: number[], seed = 1): Net {
  const rand = rng(seed);
  const weights = sizes.slice(1).map((n, l) => {
    const fanIn = sizes[l];
    const scale = Math.sqrt(2 / (fanIn + n));
    return Array.from({ length: n }, () => Array.from({ length: fanIn }, () => (rand() * 2 - 1) * scale * 1.7));
  });
  const biases = sizes.slice(1).map((n) => Array.from({ length: n }, () => 0.05 * (rand() * 2 - 1)));
  return { sizes: [...sizes], weights, biases };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Trả về giá trị kích hoạt của mọi lớp (lớp ẩn dùng tanh, lớp ra dùng sigmoid). */
export function forward(net: Net, x: number, y: number): number[][] {
  const acts: number[][] = [[x, y]];
  net.weights.forEach((W, l) => {
    const prev = acts[l];
    const isLast = l === net.weights.length - 1;
    acts.push(W.map((row, j) => {
      const z = row.reduce((s, w, k) => s + w * prev[k], net.biases[l][j]);
      return isLast ? sigmoid(z) : Math.tanh(z);
    }));
  });
  return acts;
}

export const predict = (net: Net, x: number, y: number): number => forward(net, x, y).at(-1)![0];

/** Một lượt học qua toàn bộ dữ liệu (SGD từng điểm, hàm mất mát cross-entropy). Trả về mạng mới. */
export function trainEpoch(net: Net, data: readonly Point[], lr: number): { net: Net; loss: number } {
  const weights = net.weights.map((W) => W.map((row) => [...row]));
  const biases = net.biases.map((b) => [...b]);
  const work: Net = { sizes: net.sizes, weights, biases };
  let loss = 0;
  for (const p of data) {
    const acts = forward(work, p.x, p.y);
    const out = acts.at(-1)![0];
    loss += -(p.label * Math.log(out + 1e-9) + (1 - p.label) * Math.log(1 - out + 1e-9));
    let delta = [out - p.label];
    for (let l = weights.length - 1; l >= 0; l--) {
      const prev = acts[l];
      const nextDelta = l > 0 ? prev.map((a, k) => (1 - a * a) * delta.reduce((s, d, j) => s + d * weights[l][j][k], 0)) : [];
      delta.forEach((d, j) => {
        for (let k = 0; k < prev.length; k++) weights[l][j][k] -= lr * d * prev[k];
        biases[l][j] -= lr * d;
      });
      delta = nextDelta;
    }
  }
  return { net: work, loss: loss / data.length };
}

export function accuracy(net: Net, data: readonly Point[]): number {
  const ok = data.filter((p) => (predict(net, p.x, p.y) >= 0.5 ? 1 : 0) === p.label).length;
  return ok / data.length;
}

export type DatasetKind = 'blobs' | 'circle' | 'xor' | 'spiral';

export const DATASET_LABEL: Record<DatasetKind, string> = {
  blobs: 'Hai cụm tách rời',
  circle: 'Hình tròn trong vòng',
  xor: 'Bốn góc chéo nhau',
  spiral: 'Xoắn ốc',
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function makeDataset(kind: DatasetKind, n: number, seed = 1): Point[] {
  const rand = rng(seed);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  return Array.from({ length: n }, (_, i) => {
    const label = (i % 2) as 0 | 1;
    let x = 0;
    let y = 0;
    if (kind === 'blobs') {
      const c = label ? 0.45 : -0.45;
      x = c + gauss() * 0.35;
      y = c + gauss() * 0.35;
    } else if (kind === 'circle') {
      const r = label ? rand() * 0.42 : 0.62 + rand() * 0.33;
      const a = rand() * Math.PI * 2;
      x = r * Math.cos(a);
      y = r * Math.sin(a);
    } else if (kind === 'xor') {
      x = (rand() * 0.85 + 0.08) * (rand() < 0.5 ? -1 : 1);
      y = (rand() * 0.85 + 0.08) * (rand() < 0.5 ? -1 : 1);
      return { x, y, label: (x * y > 0 ? 1 : 0) as 0 | 1 };
    } else {
      const t = (Math.floor(i / 2) / (n / 2)) * 3.2 + 0.25;
      const r = t / 3.6;
      const a = t * 1.9 + (label ? Math.PI : 0);
      x = r * Math.cos(a) + gauss() * 0.03;
      y = r * Math.sin(a) + gauss() * 0.03;
    }
    return { x: clamp(x), y: clamp(y), label };
  });
}
