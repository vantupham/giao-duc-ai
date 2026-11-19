import { useEffect, useRef, useState } from 'react';
import type { Answers, Worksheet as WorksheetData, WorksheetResult } from './types';
import { CONFIDENCE, MASTERY_LABEL } from './types';
import { useWorksheetState, type WorksheetState } from './useWorksheetState';
import { isAnswered } from './scoring';
import { QuestionView } from './QuestionView';
import { SummaryPart } from './SummaryPart';
import { ResultPanel } from './ResultPanel';
import { updateProgress } from '../progress/store';
import { setMastery } from '../progress/progress';
import './worksheet.css';
import './stepper.css';

type StepKind = 'start' | 'summary' | 'question' | 'apply' | 'reflect' | 'review';

interface Step {
  kind: StepKind;
  label: string;
  index?: number;
}

function buildSteps(ws: WorksheetData): Step[] {
  return [
    { kind: 'start', label: 'Bắt đầu' },
    { kind: 'summary', label: 'Tổng hợp' },
    ...ws.questions.map((_, i): Step => ({ kind: 'question', label: `Câu ${i + 1}`, index: i })),
    { kind: 'apply', label: 'Vận dụng' },
    { kind: 'reflect', label: 'Tự đánh giá' },
    { kind: 'review', label: 'Nộp phiếu' },
  ];
}

function isStepDone(step: Step, ws: WorksheetData, s: WorksheetState): boolean {
  const a = s.answers;
  switch (step.kind) {
    case 'start':
      return Boolean(s.student.className.trim() && s.student.studentNo.trim());
    case 'summary':
      return a.summary.every((x) => x !== null);
    case 'question':
      return isAnswered(ws.questions[step.index!], a.questions[step.index!]);
    case 'apply':
      return a.applyText.trim().length > 0 && a.applyLevel > 0;
    case 'reflect':
      return a.confidence.every((c) => c > 0);
    default:
      return false;
  }
}

/** Phiếu học tập dạng từng bước: mỗi màn hình một việc, kết thúc bằng thẻ thành tích và mã QR. */
export default function WorksheetStepper({ ws }: { ws: WorksheetData }) {
  const state = useWorksheetState(ws);
  const { student, answers, submitted, result, code, update, updateStudent } = state;
  const steps = buildSteps(ws);
  const [at, setAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const step = steps[at];

  useEffect(() => {
    if (!result) return;
    const mastery = Object.fromEntries(result.objectives.map((o) => [o.id, o.mastery]));
    updateProgress((p) => setMastery(p, ws.slug, mastery, Date.now()));
  }, [result, ws.slug]);

  const go = (i: number) => {
    setAt(Math.max(0, Math.min(steps.length - 1, i)));
    setError(null);
    requestAnimationFrame(() => bodyRef.current?.focus({ preventScroll: true }));
  };

  const submit = () => {
    const err = state.submit();
    setError(err);
    if (err) go(0);
  };

  if (submitted && result) {
    return (
      <div className="wsx">
        <MasteryCard ws={ws} result={result} name={student.name || `Số ${student.studentNo}`} className={student.className} />
        <ResultPanel ws={ws} result={result} code={code} onRetry={() => { state.retry(); go(1); }} hideMastery />
      </div>
    );
  }

  const setQuestion = (i: number, v: Answers['questions'][number]) =>
    update('questions', answers.questions.map((x, xi) => (xi === i ? v : x)));

  return (
    <div className="wsx">
      <header className="wsx-head">
        <div>
          <p className="mono wsx-kicker">Phiếu học tập · Bài {ws.lessonId} · 10–12 phút</p>
          <h3 className="wsx-title">{ws.title}</h3>
        </div>
        <ol className="wsx-dots" aria-label="Các bước của phiếu">
          {steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className={`${i === at ? 'is-at' : ''} ${isStepDone(s, ws, state) ? 'is-done' : ''} ${s.kind === 'question' ? '' : 'is-part'}`}
                aria-current={i === at ? 'step' : undefined}
                aria-label={`${s.label}${isStepDone(s, ws, state) ? ' (đã làm)' : ''}`}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>
      </header>

      <div className="wsx-body" key={at} ref={bodyRef} tabIndex={-1} aria-live="polite">
        <p className="mono wsx-step">
          Bước {at + 1}/{steps.length} · {step.label}
        </p>

        {step.kind === 'start' && (
          <div className="wsx-start">
            <p>Phiếu kiểm tra em đã đạt các mục tiêu của bài đến đâu. Không có điểm số, chỉ có mức đạt từng mục tiêu.</p>
            <ol className="wsx-goals">
              {ws.objectives.map((o) => (
                <li key={o.id}>
                  <span className="mono">{o.id}</span> {o.text}
                </li>
              ))}
            </ol>
            <div className="ws-student">
              <label>
                Lớp
                <input value={student.className} maxLength={12} onChange={(e) => updateStudent('className', e.target.value.toUpperCase())} placeholder={`${ws.lessonId.split('.')[0]}A1`} />
              </label>
              <label>
                Số TT
                <input value={student.studentNo} inputMode="numeric" maxLength={3} onChange={(e) => updateStudent('studentNo', e.target.value.replace(/\D/g, ''))} placeholder="12" />
              </label>
              <label className="ws-name">
                Tên (không bắt buộc)
                <input value={student.name} maxLength={40} onChange={(e) => updateStudent('name', e.target.value)} placeholder="Lan" />
              </label>
            </div>
          </div>
        )}

        {step.kind === 'summary' && (
          <>
            <h4 className="wsx-h">{ws.summary.title}</h4>
            <SummaryPart ws={ws} value={answers.summary} onChange={(v) => update('summary', v)} locked={false} />
          </>
        )}

        {step.kind === 'question' && (
          <QuestionView
            index={step.index!}
            question={ws.questions[step.index!]}
            value={answers.questions[step.index!]}
            onChange={(v) => setQuestion(step.index!, v)}
            result={null}
            objectiveLabel={ws.questions[step.index!].objective}
          />
        )}

        {step.kind === 'apply' && (
          <>
            <h4 className="wsx-h">Vận dụng vào tình huống mới</h4>
            <p className="ws-prompt">{ws.apply.prompt}</p>
            {ws.apply.hint && <p className="small muted">Gợi ý: {ws.apply.hint}</p>}
            <textarea rows={4} maxLength={240} value={answers.applyText} onChange={(e) => update('applyText', e.target.value)} aria-label="Câu trả lời vận dụng" />
            <p className="small muted">{answers.applyText.length}/240 kí tự. Đối chiếu với tiêu chí rồi tự chọn mức:</p>
            <div className="ws-rubric" role="radiogroup" aria-label="Tự đánh giá phần vận dụng">
              {ws.apply.rubric.map((r, i) => (
                <label key={i} className={`ws-option ${answers.applyLevel === i + 1 ? 'is-picked' : ''}`}>
                  <input type="radio" name={`${ws.slug}-rubric-x`} checked={answers.applyLevel === i + 1} onChange={() => update('applyLevel', i + 1)} />
                  <span>
                    <strong>Mức {i + 1}.</strong> {r}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}

        {step.kind === 'reflect' && (
          <>
            <h4 className="wsx-h">Em tự tin đến đâu?</h4>
            {ws.objectives.map((o, i) => (
              <div key={o.id} className="ws-conf">
                <span>
                  <strong>{o.id}</strong> {o.text}
                </span>
                <div className="ws-seg" role="radiogroup" aria-label={`Mức tự tin ${o.id}`}>
                  {CONFIDENCE.map((label, ci) => (
                    <button type="button" key={ci} role="radio" aria-checked={answers.confidence[i] === ci + 1} onClick={() => update('confidence', answers.confidence.map((c, cj) => (cj === i ? ci + 1 : c)))}>
                      {ci + 1}. {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label className="ws-field">
              Điều em còn băn khoăn là…
              <input value={answers.doubts} maxLength={160} onChange={(e) => update('doubts', e.target.value)} />
            </label>
            <label className="ws-field">
              Em có dùng AI khi làm phiếu này không? Dùng thế nào?
              <input value={answers.aiUse} maxLength={100} onChange={(e) => update('aiUse', e.target.value)} />
            </label>
          </>
        )}

        {step.kind === 'review' && (
          <>
            <h4 className="wsx-h">Kiểm tra lại trước khi nộp</h4>
            <ul className="wsx-review">
              {steps.slice(0, -1).map((s, i) => {
                const done = isStepDone(s, ws, state);
                return (
                  <li key={i} className={done ? 'is-done' : ''}>
                    <button type="button" onClick={() => go(i)}>
                      <span className="mono">{done ? '✓' : '○'}</span> {s.label}
                      {!done && <em> · chưa xong</em>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="small muted">Bài làm được lưu tự động trên máy này. Câu nào chưa trả lời sẽ tính là chưa đúng.</p>
          </>
        )}

        {error && (
          <p className="ws-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="wsx-nav">
        <button type="button" className="v2-btn" onClick={() => go(at - 1)} disabled={at === 0}>
          ← Trước
        </button>
        {step.kind === 'review' ? (
          <button type="button" className="v2-btn v2-btn-primary" onClick={submit}>
            Nộp phiếu và xem kết quả
          </button>
        ) : (
          <button type="button" className="v2-btn v2-btn-primary" onClick={() => go(at + 1)}>
            {at === 0 ? 'Bắt đầu' : 'Tiếp →'}
          </button>
        )}
      </footer>
    </div>
  );
}

interface MasteryCardProps {
  ws: WorksheetData;
  result: WorksheetResult;
  name: string;
  className: string;
}

/** Thẻ thành tích: mỗi mục tiêu một con dấu, in hoặc chụp lại được. */
function MasteryCard({ ws, result, name, className }: MasteryCardProps) {
  const best = result.objectives.filter((o) => o.mastery === 'tot').length;
  return (
    <section className="wsx-card" aria-label="Thẻ thành tích">
      <div className="wsx-card-head">
        <p className="mono">Thẻ thành tích · Bài {ws.lessonId}</p>
        <p className="wsx-card-who">
          {name} · {className}
        </p>
      </div>
      <ul className="wsx-stamps">
        {result.objectives.map((o) => {
          const obj = ws.objectives.find((x) => x.id === o.id);
          return (
            <li key={o.id} className={`wsx-stamp is-${o.mastery}`}>
              <span className="wsx-seal" aria-hidden="true">
                <span className="mono">{o.id}</span>
                <b>{MASTERY_LABEL[o.mastery]}</b>
              </span>
              <span className="wsx-stamp-text">
                {obj?.text}
                <span className="mono">
                  đúng {o.correct}/{o.total} câu
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="wsx-card-foot">
        {best === result.objectives.length
          ? 'Em đạt mức Tốt ở mọi mục tiêu. Thử giải thích bài này cho một bạn khác nhé!'
          : `Phần tổng hợp đúng ${result.summary.correct}/${result.summary.total} chỗ trống. Website không cho điểm: thầy cô xem mức đạt của từng mục tiêu.`}
      </p>
    </section>
  );
}
