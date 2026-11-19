import { useCallback, useEffect, useRef, useState } from 'react';
import { accuracy, createNet, makeDataset, predict, trainEpoch, type Net, type Point } from '../labs/neuron/nn';
import './livenet.css';

const SIZES = [2, 8, 8, 1];
const GRID = 56;
const EPOCHS_PER_FRAME = 3;
const LEARNING_RATE = 0.06;
const MAX_POINTS = 120;

type Label = 0 | 1;

interface Palette {
  a: [number, number, number];
  b: [number, number, number];
  paper: [number, number, number];
  ink: string;
}

function parseColor(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = css;
  const hex = ctx.fillStyle;
  if (hex.startsWith('#')) return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  const m = hex.match(/\d+/g) ?? ['0', '0', '0'];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  return {
    a: parseColor(s.getPropertyValue('--g10').trim() || '#0f7f6f'),
    b: parseColor(s.getPropertyValue('--accent').trim() || '#d9581d'),
    paper: parseColor(s.getPropertyValue('--card').trim() || '#ffffff'),
    ink: s.getPropertyValue('--ink').trim() || '#1a1f2b',
  };
}

function draw(canvas: HTMLCanvasElement, net: Net, points: readonly Point[], pal: Palette) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  const img = ctx.createImageData(GRID, GRID);
  for (let j = 0; j < GRID; j++)
    for (let i = 0; i < GRID; i++) {
      const p = predict(net, (i / (GRID - 1)) * 2 - 1, 1 - (j / (GRID - 1)) * 2);
      const c = p >= 0.5 ? pal.b : pal.a;
      const t = Math.min(1, Math.abs(p - 0.5) * 2) * 0.42;
      const k = (j * GRID + i) * 4;
      img.data[k] = pal.paper[0] + (c[0] - pal.paper[0]) * t;
      img.data[k + 1] = pal.paper[1] + (c[1] - pal.paper[1]) * t;
      img.data[k + 2] = pal.paper[2] + (c[2] - pal.paper[2]) * t;
      img.data[k + 3] = 255;
    }
  const off = document.createElement('canvas');
  off.width = GRID;
  off.height = GRID;
  off.getContext('2d')!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
  const r = W / 70;
  for (const p of points) {
    const x = ((p.x + 1) / 2) * W;
    const y = ((1 - p.y) / 2) * H;
    const c = p.label ? pal.b : pal.a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${c.join(',')})`;
    ctx.fill();
    ctx.lineWidth = r / 2.4;
    ctx.strokeStyle = pal.ink;
    ctx.stroke();
  }
}

/** Mạng nơ-ron nhỏ học trực tiếp: em chấm điểm, mạng vẽ lại đường phân chia ngay. */
export default function LiveNet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const netRef = useRef<Net>(createNet(SIZES, 3));
  const [points, setPoints] = useState<Point[]>(() => makeDataset('circle', 40, 7));
  const [label, setLabel] = useState<Label>(1);
  const [epoch, setEpoch] = useState(0);
  const [acc, setAcc] = useState(0);
  const [visible, setVisible] = useState(false);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapRef.current) return;
    const pal = readPalette(wrapRef.current);
    draw(canvas, netRef.current, pointsRef.current, pal);
    if (!visible) return;
    let raf = 0;
    let frames = 0;
    const tick = () => {
      const data = pointsRef.current;
      const hasBoth = data.some((p) => p.label === 0) && data.some((p) => p.label === 1);
      if (hasBoth) {
        let net = netRef.current;
        for (let i = 0; i < EPOCHS_PER_FRAME; i++) net = trainEpoch(net, data, LEARNING_RATE).net;
        netRef.current = net;
        frames += 1;
        if (frames % 6 === 0) {
          setEpoch((e) => e + EPOCHS_PER_FRAME * 6);
          setAcc(accuracy(net, data));
        }
      }
      draw(canvas, netRef.current, data, pal);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, points]);

  const addPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;
      setPoints((ps) => [...ps, { x, y, label }].slice(-MAX_POINTS));
    },
    [label],
  );

  const reset = (next: Point[]) => {
    netRef.current = createNet(SIZES, Math.floor(Math.random() * 1000) + 1);
    setEpoch(0);
    setAcc(0);
    setPoints(next);
  };

  return (
    <div className="livenet" ref={wrapRef}>
      <div className="ln-frame">
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          onPointerDown={addPoint}
          aria-label="Vùng chấm điểm. Bấm để thêm một điểm, mạng nơ-ron sẽ học lại đường phân chia."
          role="img"
        />
        <span className="ln-axis mono" aria-hidden="true">
          mạng 2 → 8 → 8 → 1
        </span>
      </div>
      <div className="ln-bar">
        <div className="ln-pick" role="radiogroup" aria-label="Màu điểm sẽ chấm">
          <button type="button" role="radio" aria-checked={label === 0} className="ln-a" onClick={() => setLabel(0)}>
            <span /> Nhóm xanh
          </button>
          <button type="button" role="radio" aria-checked={label === 1} className="ln-b" onClick={() => setLabel(1)}>
            <span /> Nhóm cam
          </button>
        </div>
        <div className="ln-stats mono" aria-live="off">
          <span>
            lượt học <b>{epoch}</b>
          </span>
          <span>
            đúng <b>{Math.round(acc * 100)}%</b>
          </span>
        </div>
        <div className="ln-actions">
          <button type="button" onClick={() => reset(makeDataset('xor', 40, Math.floor(Math.random() * 99) + 1))}>
            Đổi đề
          </button>
          <button type="button" onClick={() => reset([])}>
            Xóa hết
          </button>
        </div>
      </div>
    </div>
  );
}
