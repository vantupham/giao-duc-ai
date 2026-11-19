import { describe, expect, test } from 'vitest';
import { neuron, perceptronStep, createNet, predict, trainEpoch, accuracy, makeDataset, type Point } from './nn';

describe('neuron – nơ-ron giấy của Bình (Bài 11.10)', () => {
  const w = [-3, 2, 2];
  test.each([
    ['Thứ Hai', [0, 1, 1], 4, true],
    ['Thứ Ba', [1, 1, 1], 1, false],
    ['Thứ Tư', [0, 1, 0], 2, true],
    ['Thứ Năm', [1, 1, 0], -1, false],
  ])('%s: tổng và kết quả khớp bảng trong tài liệu', (_d, x, sum, fires) => {
    expect(neuron(x as number[], w, 2)).toEqual({ sum, fires });
  });
});

describe('perceptronStep', () => {
  test('đoán đúng thì giữ nguyên trọng số', () => {
    expect(perceptronStep({ weights: [-3, 2, 2], threshold: 2 }, [0, 1, 1], true)).toEqual({ weights: [-3, 2, 2], threshold: 2, changed: false });
  });

  test('đoán sai thứ Ba thì chỉnh trọng số các tín hiệu đang bật theo hướng đúng', () => {
    const r = perceptronStep({ weights: [-3, 2, 2], threshold: 2 }, [1, 1, 1], true);
    expect(r.changed).toBe(true);
    expect(neuron([1, 1, 1], r.weights, r.threshold).fires).toBe(true);
    expect(r.weights[0]).toBeGreaterThan(-3);
  });

  test('mặc định giữ ngưỡng cố định như tài liệu', () => {
    expect(perceptronStep({ weights: [-3, 2, 2], threshold: 2 }, [1, 1, 1], true).threshold).toBe(2);
    expect(perceptronStep({ weights: [-3, 2, 2], threshold: 2 }, [1, 1, 1], true, true).threshold).toBe(1);
  });

  test('vài bước tự chỉnh là khớp đủ 6 buổi sáng của Bình và của Chi', () => {
    const days = [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1]];
    const people = {
      binh: (x: number[]) => (x[0] ? x[1] === 1 && x[2] === 1 : x[1] === 1 || x[2] === 1),
      chi: (x: number[]) => x[0] === 0 && x[1] === 1,
    };
    for (const truth of Object.values(people)) {
      let s = { weights: [-3, 2, 2], threshold: 2 };
      for (let i = 0; i < 20; i++) {
        const wrong = days.find((d) => neuron(d, s.weights, s.threshold).fires !== truth(d));
        if (!wrong) break;
        s = perceptronStep(s, wrong, truth(wrong));
      }
      expect(days.every((d) => neuron(d, s.weights, s.threshold).fires === truth(d))).toBe(true);
    }
  });

  test('không thay đổi dữ liệu đầu vào', () => {
    const state = { weights: [-3, 2, 2], threshold: 2 };
    perceptronStep(state, [1, 1, 1], true);
    expect(state).toEqual({ weights: [-3, 2, 2], threshold: 2 });
  });
});

describe('mạng nơ-ron nhiều lớp', () => {
  test('cấu trúc mạng đúng số lớp và số trọng số', () => {
    const net = createNet([2, 4, 1], 1);
    expect(net.weights.map((m) => [m.length, m[0].length])).toEqual([
      [4, 2],
      [1, 4],
    ]);
  });

  test('tạo dữ liệu có đủ hai nhãn, toạ độ trong [-1, 1]', () => {
    for (const kind of ['blobs', 'circle', 'xor', 'spiral'] as const) {
      const d = makeDataset(kind, 200, 7);
      expect(d).toHaveLength(200);
      expect(new Set(d.map((p) => p.label))).toEqual(new Set([0, 1]));
      expect(d.every((p) => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1)).toBe(true);
    }
  });

  test('cùng hạt giống thì sinh cùng dữ liệu', () => {
    expect(makeDataset('xor', 50, 3)).toEqual(makeDataset('xor', 50, 3));
  });

  test('học được bài XOR khi có lớp ẩn', () => {
    const data = makeDataset('xor', 200, 11);
    let net = createNet([2, 6, 1], 5);
    for (let i = 0; i < 300; i++) net = trainEpoch(net, data, 0.1).net;
    expect(accuracy(net, data)).toBeGreaterThan(0.95);
  });

  test('không có lớp ẩn thì không tách được hình tròn', () => {
    const data = makeDataset('circle', 200, 2);
    let net = createNet([2, 1], 3);
    for (let i = 0; i < 200; i++) net = trainEpoch(net, data, 0.1).net;
    expect(accuracy(net, data)).toBeLessThan(0.8);
  });

  test('predict trả về xác suất trong khoảng 0..1', () => {
    const net = createNet([2, 3, 1], 9);
    const p: Point = { x: 0.3, y: -0.2, label: 1 };
    const v = predict(net, p.x, p.y);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });
});
