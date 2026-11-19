import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createNet, makeDataset, trainEpoch, accuracy, forward, DATASET_LABEL, type DatasetKind, type Net } from '../neuron/nn';
import { BoundaryCanvas } from './BoundaryCanvas';
import { hasWebGL } from '../../../lib/webgl';
import './network.css';

const Network3D = lazy(() => import('./Network3D'));

const KINDS = Object.keys(DATASET_LABEL) as DatasetKind[];
const POINTS = 240;
const TARGET = 0.95;

export default function NetworkPlayground() {
  const [kind, setKind] = useState<DatasetKind>('circle');
  const [hidden, setHidden] = useState<number[]>([3]);
  const [lr, setLr] = useState(0.05);
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => makeDataset(kind, POINTS, 7), [kind]);
  const sizes = useMemo(() => [2, ...hidden, 1], [hidden]);
  const [net, setNet] = useState<Net>(() => createNet([2, 3, 1], 1));
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const netRef = useRef(net);
  netRef.current = net;

  useEffect(() => setWebgl(hasWebGL()), []);

  useEffect(() => {
    setNet(createNet(sizes, seed));
    setEpoch(0);
    setLoss(null);
    setRunning(false);
  }, [sizes, seed, kind]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      let n = netRef.current;
      let l = 0;
      for (let i = 0; i < 2; i++) {
        const r = trainEpoch(n, data, lr);
        n = r.net;
        l = r.loss;
      }
      setNet(n);
      setLoss(l);
      setEpoch((e) => e + 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, data, lr]);

  const acc = accuracy(net, data);
  const neurons = hidden.reduce((s, n) => s + n, 0);

  useEffect(() => {
    if (acc >= TARGET && epoch > 0) {
      setBest((b) => (b[kind] === undefined || neurons < b[kind] ? { ...b, [kind]: neurons } : b));
    }
  }, [acc, epoch, kind, neurons]);

  const activations = useMemo(() => forward(net, 0.3, 0.3), [net]);
  const setLayer = (i: number, delta: number) => setHidden((h) => h.map((n, j) => (j === i ? Math.max(1, Math.min(8, n + delta)) : n)));

  return (
    <div className="np">
      <div className="np-controls">
        <label>
          Bộ dữ liệu
          <select value={kind} onChange={(e) => setKind(e.target.value as DatasetKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {DATASET_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tốc độ học
          <select value={lr} onChange={(e) => setLr(Number(e.target.value))}>
            {[0.01, 0.03, 0.05, 0.1, 0.3].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <div className="np-layers">
          <span>Lớp ẩn: {hidden.length}</span>
          <button type="button" className="btn" onClick={() => setHidden((h) => (h.length < 3 ? [...h, 2] : h))} disabled={hidden.length >= 3}>
            + lớp
          </button>
          <button type="button" className="btn" onClick={() => setHidden((h) => h.slice(0, -1))} disabled={hidden.length === 0}>
            − lớp
          </button>
        </div>
      </div>

      <div className="np-layer-row">
        <span className="np-chip">Lớp vào: 2 nơ-ron (x, y)</span>
        {hidden.map((n, i) => (
          <span key={i} className="np-chip">
            Lớp ẩn {i + 1}: <button type="button" onClick={() => setLayer(i, -1)} aria-label={`Bớt nơ-ron lớp ẩn ${i + 1}`}>−</button> {n}{' '}
            <button type="button" onClick={() => setLayer(i, 1)} aria-label={`Thêm nơ-ron lớp ẩn ${i + 1}`}>+</button>
          </span>
        ))}
        <span className="np-chip">Lớp ra: 1 nơ-ron</span>
      </div>

      <div className="np-stage">
        <div>
          <BoundaryCanvas net={net} data={data} />
          <div className="np-stats">
            <span>Lượt học: <strong>{epoch}</strong></span>
            <span>Độ chính xác: <strong className={acc >= TARGET ? 'np-good' : ''}>{Math.round(acc * 100)}%</strong></span>
            <span>Sai số: <strong>{loss === null ? '–' : loss.toFixed(3)}</strong></span>
          </div>
          <div className="ws-actions">
            <button type="button" className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
              {running ? '⏸ Tạm dừng' : '▶ Huấn luyện'}
            </button>
            <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
              ↺ Khởi tạo lại trọng số
            </button>
          </div>
        </div>
        <div>
          {webgl === false ? (
            <p className="muted small">Máy này không hỗ trợ đồ họa 3D (WebGL). Em vẫn quan sát được đường phân chia ở bên trái.</p>
          ) : webgl ? (
            <Suspense fallback={<p className="muted">Đang tải mô hình 3D…</p>}>
              <Network3D net={net} activations={activations} />
            </Suspense>
          ) : null}
          <p className="small muted">Kéo để xoay. Đường xanh: trọng số dương; đường cam: trọng số âm; càng dày, trọng số càng lớn. Nút sáng theo mức “phát” khi đưa vào điểm (0,3; 0,3).</p>
        </div>
      </div>

      <div className="np-challenge">
        <strong>Thử thách:</strong> tìm cấu hình ít nơ-ron ẩn nhất mà mạng vẫn đạt từ {Math.round(TARGET * 100)}% trở lên.
        <ul className="small">
          {KINDS.map((k) => (
            <li key={k}>
              {DATASET_LABEL[k]}: {best[k] === undefined ? 'chưa đạt' : `kỉ lục của em là ${best[k]} nơ-ron ẩn`}
            </li>
          ))}
        </ul>
        <p className="small muted">Gợi ý: “Hai cụm tách rời” đạt được cả khi không có lớp ẩn nào. “Hình tròn” thì sao? Vì sao?</p>
      </div>
    </div>
  );
}
