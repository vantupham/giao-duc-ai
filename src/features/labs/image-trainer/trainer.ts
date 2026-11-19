// Bộ phân loại ảnh chạy hoàn toàn trên trình duyệt: MobileNet trích đặc trưng + k láng giềng gần nhất (KNN).
// Ảnh của học sinh không rời khỏi máy.
import type { MobileNet } from '@tensorflow-models/mobilenet';
import type { KNNClassifier } from '@tensorflow-models/knn-classifier';

type Tf = typeof import('@tensorflow/tfjs');

export interface Prediction {
  label: number;
  confidences: Record<number, number>;
}

export interface Trainer {
  addExample: (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, label: number) => void;
  predict: (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<Prediction | null>;
  counts: () => Record<number, number>;
  clearLabel: (label: number) => void;
  dispose: () => void;
}

export async function createTrainer(modelUrl: string): Promise<Trainer> {
  const tf: Tf = await import('@tensorflow/tfjs');
  const [{ load }, knnMod] = await Promise.all([import('@tensorflow-models/mobilenet'), import('@tensorflow-models/knn-classifier')]);
  await tf.ready();
  const net: MobileNet = await load({ version: 2, alpha: 0.5, modelUrl });
  const knn: KNNClassifier = knnMod.create();

  const embed = (src: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => net.infer(src, true);

  return {
    addExample(src, label) {
      const e = embed(src);
      knn.addExample(e, label);
      e.dispose();
    },
    async predict(src) {
      if (knn.getNumClasses() < 2) return null;
      const e = embed(src);
      try {
        const r = await knn.predictClass(e, 10);
        return { label: Number(r.label), confidences: Object.fromEntries(Object.entries(r.confidences).map(([k, v]) => [Number(k), v])) };
      } finally {
        e.dispose();
      }
    },
    counts() {
      return Object.fromEntries(Object.entries(knn.getClassExampleCount()).map(([k, v]) => [Number(k), v]));
    },
    clearLabel(label) {
      if (knn.getClassExampleCount()[label]) knn.clearClass(label);
    },
    dispose() {
      knn.dispose();
    },
  };
}

/** Ảnh thu nhỏ để hiển thị trong ô "Dữ liệu" (không lưu đi đâu). */
export function thumbnail(src: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, size = 56): string {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const w = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
  const h = src instanceof HTMLVideoElement ? src.videoHeight : src.height;
  const s = Math.min(w, h);
  ctx.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.7);
}
