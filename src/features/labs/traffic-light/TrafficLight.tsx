import { useState } from 'react';
import { CASES, ZONE_LABEL, LAYER_LABEL, NATURE_LABEL, type Zone } from './cases';
import './traffic-light.css';

const ZONES: Zone[] = ['xanh', 'vang', 'do'];

export default function TrafficLight() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, Zone>>({});
  const [big, setBig] = useState(false);
  const done = index >= CASES.length;
  const current = CASES[Math.min(index, CASES.length - 1)];
  const pick = picks[current.id];
  const correctCount = CASES.filter((c) => picks[c.id] && c.zones.includes(picks[c.id])).length;

  const choose = (z: Zone) => {
    if (!pick) setPicks((p) => ({ ...p, [current.id]: z }));
  };

  const reset = () => {
    setPicks({});
    setIndex(0);
  };

  return (
    <div className={`tl ${big ? 'tl-big' : ''}`}>
      <div className="tl-top">
        <div className="tl-progress" aria-label={`Tình huống ${Math.min(index + 1, CASES.length)} trên ${CASES.length}`}>
          {CASES.map((c, i) => {
            const p = picks[c.id];
            const state = p ? (c.zones.includes(p) ? 'ok' : 'bad') : i === index ? 'now' : '';
            return <span key={c.id} className={`tl-dot tl-dot-${state}`} />;
          })}
        </div>
        <button type="button" className="btn" onClick={() => setBig((b) => !b)}>
          {big ? 'Thu nhỏ' : 'Chế độ trình chiếu'}
        </button>
      </div>

      {!done ? (
        <div className="tl-stage">
          <div className="tl-lights" aria-hidden="true">
            {ZONES.map((z) => (
              <span key={z} className={`tl-light tl-${z} ${pick === z ? 'is-on' : ''}`} />
            ))}
          </div>
          <div className="tl-card">
            <p className="tl-source">{current.source}</p>
            <p className="tl-text">{current.text}</p>
            <div className="tl-buttons" role="group" aria-label="Chọn vùng">
              {ZONES.map((z) => (
                <button key={z} type="button" className={`tl-btn tl-btn-${z} ${pick === z ? 'is-picked' : ''}`} onClick={() => choose(z)} disabled={Boolean(pick)}>
                  {ZONE_LABEL[z]}
                </button>
              ))}
            </div>
            {pick && (
              <div className={`tl-feedback ${current.zones.includes(pick) ? 'ok' : 'bad'}`} aria-live="polite">
                <p>
                  <strong>{current.zones.includes(pick) ? 'Hợp lí.' : `Chưa đúng: vùng ${current.zones.map((z) => ZONE_LABEL[z].split(':')[0].toLowerCase()).join(' hoặc ')}.`}</strong> {current.why}
                </p>
                <p className="tl-tags">
                  <span>{NATURE_LABEL[current.nature]}</span>
                  <span>{LAYER_LABEL[current.layer]}</span>
                </p>
                {current.better && (
                  <p>
                    <strong>Cách đúng:</strong> {current.better}
                  </p>
                )}
                <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
                  {index === CASES.length - 1 ? 'Xem tổng kết' : 'Tình huống tiếp →'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="tl-summary">
          <h4>
            Em xếp hợp lí {correctCount}/{CASES.length} tình huống
          </h4>
          <p>Trước khi dùng AI, hãy mang theo ba câu tự hỏi:</p>
          <ol>
            <li>Việc này có được phép không? (Theo Quy tắc của trường và yêu cầu của thầy cô.)</li>
            <li>Có gây hại hay làm lộ thông tin của ai không?</li>
            <li>Mình có kiểm chứng và khai báo không?</li>
          </ol>
          {correctCount < CASES.length && (
            <>
              <p className="small muted">Các tình huống em cần xem lại:</p>
              <ul className="small">
                {CASES.filter((c) => !c.zones.includes(picks[c.id])).map((c) => (
                  <li key={c.id}>
                    <strong>{c.source}:</strong> {c.text} → {c.zones.map((z) => ZONE_LABEL[z]).join(' / ')}
                  </li>
                ))}
              </ul>
            </>
          )}
          <button type="button" className="btn" onClick={reset}>
            Làm lại từ đầu
          </button>
        </div>
      )}
    </div>
  );
}
