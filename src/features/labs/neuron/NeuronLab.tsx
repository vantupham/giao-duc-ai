import { useState } from 'react';
import { neuron, perceptronStep } from './nn';
import './neuron.css';

const SIGNALS = [
  { key: 'A', label: 'Trời đang mưa', icon: '🌧️' },
  { key: 'B', label: 'Còn kịp giờ', icon: '⏰' },
  { key: 'C', label: 'Có bạn đi cùng', icon: '🧑‍🤝‍🧑' },
];

interface Morning {
  day: string;
  x: number[];
}

const DAYS: Morning[] = [
  { day: 'Thứ Hai', x: [0, 1, 1] },
  { day: 'Thứ Ba', x: [1, 1, 1] },
  { day: 'Thứ Tư', x: [0, 1, 0] },
  { day: 'Thứ Năm', x: [1, 1, 0] },
  { day: 'Thứ Sáu', x: [0, 0, 1] },
  { day: 'Thứ Bảy', x: [1, 0, 1] },
];

/** Thói quen thật: Bình vẫn đi xe đạp sáng thứ Ba dù mưa (theo tài liệu); Chi cứ mưa là không đi, kịp giờ và không mưa thì đi. */
const PEOPLE: Record<string, { name: string; truth: (x: number[]) => boolean; note: string }> = {
  binh: { name: 'Bình', truth: (x) => (x[0] ? x[1] === 1 && x[2] === 1 : x[1] === 1 || x[2] === 1), note: 'Quan sát thật: sáng thứ Ba trời mưa nhưng kịp giờ và có bạn nên Bình vẫn đi.' },
  chi: { name: 'Chi', truth: (x) => x[0] === 0 && x[1] === 1, note: 'Chi rất ghét mưa: cứ mưa là không đi. Không mưa và kịp giờ thì đi, dù không có bạn.' },
};

const INITIAL = { weights: [-3, 2, 2], threshold: 2 };

export default function NeuronLab() {
  const [x, setX] = useState([1, 1, 1]);
  const [weights, setWeights] = useState(INITIAL.weights);
  const [threshold, setThreshold] = useState(INITIAL.threshold);
  const [person, setPerson] = useState<keyof typeof PEOPLE>('binh');
  const [log, setLog] = useState<string[]>([]);
  const out = neuron(x, weights, threshold);
  const truth = PEOPLE[person].truth;
  const rows = DAYS.map((d) => {
    const r = neuron(d.x, weights, threshold);
    return { ...d, ...r, real: truth(d.x), ok: r.fires === truth(d.x) };
  });
  const matches = rows.filter((r) => r.ok).length;

  const learnOnce = () => {
    const wrong = rows.find((r) => !r.ok);
    if (!wrong) {
      setLog((l) => [`Nơ-ron đã đoán đúng cả ${rows.length} buổi sáng. Không cần chỉnh nữa.`, ...l]);
      return;
    }
    const next = perceptronStep({ weights, threshold }, wrong.x, wrong.real);
    setWeights(next.weights);
    setThreshold(next.threshold);
    setX(wrong.x);
    const changedNames = SIGNALS.filter((_, i) => wrong.x[i]).map((s) => s.key).join(', ');
    setLog((l) => [
      `${wrong.day}: đoán “${wrong.fires ? 'đi' : 'không đi'}”, thực tế “${wrong.real ? 'đi' : 'không đi'}” → ${wrong.real ? 'tăng' : 'giảm'} trọng số ${changedNames || '(không có tín hiệu bật)'} thêm 1 đơn vị.`,
      ...l,
    ].slice(0, 6));
  };

  const reset = () => {
    setWeights(INITIAL.weights);
    setThreshold(INITIAL.threshold);
    setLog([]);
  };

  return (
    <div className="nl">
      <div className="nl-grid">
        <div>
          <svg viewBox="0 0 360 230" className="nl-svg" role="img" aria-label={`Tổng ${out.sum}, ${out.fires ? 'đi xe đạp' : 'không đi'}`}>
            {SIGNALS.map((s, i) => {
              const y = 40 + i * 75;
              const w = weights[i];
              const active = x[i] === 1;
              return (
                <g key={s.key}>
                  <line x1="62" y1={y} x2="230" y2="115" stroke={w >= 0 ? 'var(--box-concept)' : 'var(--box-pitfall)'} strokeWidth={1 + Math.abs(w) * 1.4} opacity={active ? 0.95 : 0.25} />
                  <text x="150" y={y + (115 - y) * 0.45 - 6} className="nl-w">{w > 0 ? `+${w}` : w}</text>
                  <circle cx="40" cy={y} r="24" className={active ? 'nl-in on' : 'nl-in'} />
                  <text x="40" y={y + 6} textAnchor="middle" className="nl-in-t">{x[i]}</text>
                </g>
              );
            })}
            <circle cx="255" cy="115" r="34" className={out.fires ? 'nl-n fire' : 'nl-n'} />
            <text x="255" y="111" textAnchor="middle" className="nl-sum">Σ = {out.sum}</text>
            <text x="255" y="128" textAnchor="middle" className="nl-th">ngưỡng {threshold}</text>
            <line x1="289" y1="115" x2="318" y2="115" stroke="var(--muted)" strokeWidth="2" />
            <text x="338" y="122" textAnchor="middle" fontSize="22">{out.fires ? '🚲' : '🏠'}</text>
          </svg>
          <p className={`nl-result ${out.fires ? 'go' : 'stay'}`}>{out.fires ? 'Kết quả: đi xe đạp' : 'Kết quả: không đi'}</p>
        </div>
        <div className="nl-controls">
          {SIGNALS.map((s, i) => (
            <div key={s.key} className="nl-row">
              <button type="button" className={`nl-toggle ${x[i] ? 'on' : ''}`} aria-pressed={x[i] === 1} onClick={() => setX(x.map((v, j) => (j === i ? 1 - v : v)))}>
                <span aria-hidden="true">{s.icon}</span> {s.key}. {s.label}: <strong>{x[i] ? 'có (1)' : 'không (0)'}</strong>
              </button>
              <label className="nl-slider">
                Trọng số {s.key}: <strong>{weights[i] > 0 ? `+${weights[i]}` : weights[i]}</strong>
                <input type="range" min={-5} max={5} step={1} value={weights[i]} onChange={(e) => setWeights(weights.map((w, j) => (j === i ? Number(e.target.value) : w)))} />
              </label>
            </div>
          ))}
          <label className="nl-slider">
            Ngưỡng: <strong>{threshold}</strong> (tổng từ ngưỡng trở lên thì đi)
            <input type="range" min={-3} max={6} step={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="nl-train">
        <div className="nl-train-head">
          <h4>Huấn luyện: cho nơ-ron khớp với thói quen thật</h4>
          <div className="ws-seg" role="radiogroup" aria-label="Chọn người">
            {Object.entries(PEOPLE).map(([k, p]) => (
              <button key={k} type="button" role="radio" aria-checked={person === k} onClick={() => setPerson(k as keyof typeof PEOPLE)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <p className="small muted">{PEOPLE[person].note}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Buổi sáng</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>Tổng</th>
                <th>Nơ-ron đoán</th>
                <th>Thực tế</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day} className={r.ok ? '' : 'nl-miss'} onClick={() => setX(r.x)} style={{ cursor: 'pointer' }}>
                  <td>{r.day}</td>
                  {r.x.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                  <td>{r.sum}</td>
                  <td>{r.fires ? 'Đi' : 'Không đi'}</td>
                  <td>
                    {r.real ? 'Đi' : 'Không đi'} {r.ok ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>
            Nơ-ron đoán đúng {matches}/{rows.length} buổi sáng.
          </strong>{' '}
          Em hãy tự kéo trọng số cho khớp, hoặc để máy tự chỉnh từng bước.
        </p>
        <div className="ws-actions">
          <button type="button" className="btn btn-primary" onClick={learnOnce}>
            Máy tự chỉnh một bước
          </button>
          <button type="button" className="btn" onClick={reset}>
            Đặt lại (−3, +2, +2; ngưỡng 2)
          </button>
        </div>
        {log.length > 0 && (
          <ol className="nl-log small" reversed>
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        )}
        <p className="small muted">
          Đây chính là “huấn luyện”: xem ví dụ đã biết kết quả, so với điều nơ-ron đoán, rồi chỉnh trọng số từng chút một. Máy tính làm đúng việc này với hàng triệu nơ-ron và hàng triệu ví dụ.
        </p>
      </div>
    </div>
  );
}
