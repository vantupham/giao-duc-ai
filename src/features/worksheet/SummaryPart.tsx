import type { Worksheet } from './types';
import { blanksOf, wordBank } from './scoring';

interface SummaryPartProps {
  ws: Worksheet;
  value: (number | null)[];
  onChange: (v: (number | null)[]) => void;
  locked: boolean;
}

/** Phần A: điền từ vào sơ đồ bài học, chọn từ ngân hàng từ. */
export function SummaryPart({ ws, value, onChange, locked }: SummaryPartProps) {
  const bank = wordBank(ws);
  const blanks = blanksOf(ws);
  let counter = 0;
  return (
    <div className="ws-summary">
      <p className="ws-bank">
        <span className="muted small">Ngân hàng từ:</span> {bank.map((w) => <span key={w} className="ws-word">{w}</span>)}
      </p>
      <ul>
        {ws.summary.lines.map((line, li) => (
          <li key={li}>
            {line.split(/(\[\[.+?\]\])/).map((part, pi) => {
              if (!/^\[\[.+\]\]$/.test(part)) return <span key={pi}>{part}</span>;
              const idx = counter++;
              const pick = value[idx];
              const state = locked ? (pick !== null && bank[pick] === blanks[idx] ? 'is-right' : 'is-wrong') : '';
              return (
                <select
                  key={pi}
                  className={`ws-blank ${state}`}
                  aria-label={`Chỗ trống ${idx + 1}`}
                  disabled={locked}
                  value={pick ?? ''}
                  onChange={(e) => onChange(value.map((v, vi) => (vi === idx ? (e.target.value === '' ? null : Number(e.target.value)) : v)))}
                >
                  <option value="">……</option>
                  {bank.map((w, wi) => (
                    <option key={w} value={wi}>
                      {w}
                    </option>
                  ))}
                </select>
              );
            })}
          </li>
        ))}
      </ul>
      {locked && (
        <p className="small muted">
          Đáp án: {blanks.join(' · ')}
        </p>
      )}
    </div>
  );
}
