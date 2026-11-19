import { useMemo } from 'react';
import type { Question, QuestionResult } from './types';
import { LEVEL_LABEL } from './types';
import { seededShuffle } from './scoring';

type AnswerValue = number | number[] | null;

interface QuestionViewProps {
  index: number;
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  result: QuestionResult | null;
  objectiveLabel: string;
}

export function QuestionView({ index, question: q, value, onChange, result, objectiveLabel }: QuestionViewProps) {
  const locked = result !== null;
  const status = result ? (result.correct ? 'ok' : 'bad') : '';
  return (
    <fieldset className={`ws-q ${status ? `ws-q-${status}` : ''}`} disabled={locked}>
      <legend>
        <span className="ws-q-no">Câu {index + 1}</span>
        <span className="ws-tag">{objectiveLabel}</span>
        <span className="ws-tag">{LEVEL_LABEL[q.level]}</span>
      </legend>
      <p className="ws-prompt">{q.prompt}</p>
      {q.type === 'single' && (
        <div className="ws-options">
          {q.options.map((o, i) => (
            <label key={i} className={`ws-option ${value === i ? 'is-picked' : ''} ${locked && o.correct ? 'is-correct' : ''}`}>
              <input type="radio" name={q.id} checked={value === i} onChange={() => onChange(i)} />
              <span>{o.text}</span>
            </label>
          ))}
        </div>
      )}
      {q.type === 'truefalse' && (
        <div className="ws-options ws-row">
          {[
            { v: 1, label: 'Đúng' },
            { v: 0, label: 'Sai' },
          ].map((o) => (
            <label key={o.v} className={`ws-option ${value === o.v ? 'is-picked' : ''} ${locked && (o.v === 1) === q.answer ? 'is-correct' : ''}`}>
              <input type="radio" name={q.id} checked={value === o.v} onChange={() => onChange(o.v)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
      {q.type === 'order' && <OrderInput id={q.id} items={q.items} value={value} onChange={onChange} />}
      {q.type === 'classify' && (
        <div className="ws-classify">
          {q.items.map((it, i) => {
            const picks = Array.isArray(value) ? value : q.items.map(() => -1);
            return (
              <div key={i} className={`ws-classify-row ${locked ? (picks[i] === it.category ? 'is-right' : 'is-wrong') : ''}`}>
                <span className="ws-classify-text">{it.text}</span>
                <div className="ws-seg" role="radiogroup" aria-label={it.text}>
                  {q.categories.map((c, ci) => (
                    <button
                      type="button"
                      key={ci}
                      role="radio"
                      aria-checked={picks[i] === ci}
                      className={locked && it.category === ci ? 'is-correct' : ''}
                      onClick={() => onChange(picks.map((p, pi) => (pi === i ? ci : p)))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {result && (
        <div className={`ws-feedback ws-feedback-${status}`}>
          <strong>{result.correct ? 'Chính xác.' : result.answered ? 'Chưa đúng.' : 'Em chưa trả lời câu này.'}</strong> {q.explanation}
        </div>
      )}
    </fieldset>
  );
}

interface OrderInputProps {
  id: string;
  items: string[];
  value: AnswerValue;
  onChange: (v: number[]) => void;
}

function OrderInput({ id, items, value, onChange }: OrderInputProps) {
  const initial = useMemo(() => seededShuffle(items.map((_, i) => i), id), [id, items]);
  const order = Array.isArray(value) && value.length === items.length ? value : initial;
  const move = (pos: number, delta: number) => {
    const target = pos + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[pos], next[target]] = [next[target], next[pos]];
    onChange(next);
  };
  return (
    <ol className="ws-order">
      {order.map((itemIdx, pos) => (
        <li key={itemIdx}>
          <span className="ws-order-text">{items[itemIdx]}</span>
          <span className="ws-order-btns">
            <button type="button" aria-label="Đưa lên" onClick={() => move(pos, -1)} disabled={pos === 0}>
              ▲
            </button>
            <button type="button" aria-label="Đưa xuống" onClick={() => move(pos, 1)} disabled={pos === order.length - 1}>
              ▼
            </button>
          </span>
        </li>
      ))}
      {!Array.isArray(value) && (
        <li className="ws-order-hint">
          <button type="button" className="btn" onClick={() => onChange(order)}>
            Giữ nguyên thứ tự này
          </button>
        </li>
      )}
    </ol>
  );
}
