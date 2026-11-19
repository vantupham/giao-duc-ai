import { useEffect, useRef } from 'react';
import { predict, type Net, type Point } from '../neuron/nn';

interface BoundaryCanvasProps {
  net: Net;
  data: Point[];
  size?: number;
}

const GRID = 48;

/** Vẽ vùng mạng dự đoán (màu nền) và các điểm dữ liệu (chấm tròn). */
export function BoundaryCanvas({ net, data, size = 340 }: BoundaryCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = size / GRID;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = (i + 0.5) / GRID * 2 - 1;
        const y = 1 - (j + 0.5) / GRID * 2;
        const p = predict(net, x, y);
        const t = Math.abs(p - 0.5) * 2;
        ctx.fillStyle = p >= 0.5 ? `rgba(47,111,219,${0.12 + t * 0.45})` : `rgba(224,122,47,${0.12 + t * 0.45})`;
        ctx.fillRect(i * cell, j * cell, cell + 0.5, cell + 0.5);
      }
    }
    for (const pt of data) {
      const px = (pt.x + 1) / 2 * size;
      const py = (1 - pt.y) / 2 * size;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = pt.label ? '#2f6fdb' : '#e07a2f';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }, [net, data, size]);

  return <canvas ref={ref} style={{ width: size, height: size, maxWidth: '100%', borderRadius: 12, border: '1px solid var(--line)' }} aria-label="Đường phân chia hai nhóm điểm" role="img" />;
}
