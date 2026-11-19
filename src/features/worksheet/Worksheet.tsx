import { useState } from 'react';
import type { Worksheet as WorksheetData } from './types';
import { CONFIDENCE } from './types';
import { useWorksheetState } from './useWorksheetState';
import { QuestionView } from './QuestionView';
import { SummaryPart } from './SummaryPart';
import { ResultPanel } from './ResultPanel';
import './worksheet.css';

export default function Worksheet({ ws }: { ws: WorksheetData }) {
  const { student, answers, submitted, result, code, missing, update, updateStudent, submit: trySubmit, retry } = useWorksheetState(ws);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (missing > 0 && student.className.trim() && student.studentNo.trim() && !window.confirm(`Em còn ${missing} câu chưa trả lời. Vẫn nộp phiếu?`)) return;
    setError(trySubmit());
  };

  const locked = submitted;

  return (
    <div className="ws">
      <header className="ws-head">
        <div>
          <p className="ws-kicker">Phiếu học tập · 10–12 phút</p>
          <h3>{ws.title}</h3>
        </div>
        <div className="ws-student">
          <label>
            Lớp
            <input value={student.className} maxLength={12} onChange={(e) => updateStudent('className', e.target.value.toUpperCase())} placeholder="10A1" disabled={locked} />
          </label>
          <label>
            Số TT
            <input value={student.studentNo} inputMode="numeric" maxLength={3} onChange={(e) => updateStudent('studentNo', e.target.value.replace(/\D/g, ''))} placeholder="12" disabled={locked} />
          </label>
          <label className="ws-name">
            Tên (không bắt buộc)
            <input value={student.name} maxLength={40} onChange={(e) => updateStudent('name', e.target.value)} placeholder="Lan" disabled={locked} />
          </label>
        </div>
      </header>

      <ol className="ws-objectives small">
        {ws.objectives.map((o) => (
          <li key={o.id}>
            <strong>{o.id}</strong> {o.text}
          </li>
        ))}
      </ol>

      <section className="ws-part">
        <h4><span className="ws-part-letter">A</span> {ws.summary.title}</h4>
        <SummaryPart ws={ws} value={answers.summary} onChange={(v) => update('summary', v)} locked={locked} />
      </section>

      <section className="ws-part">
        <h4><span className="ws-part-letter">B</span> Kiểm tra hiểu</h4>
        {ws.questions.map((q, i) => (
          <QuestionView
            key={q.id}
            index={i}
            question={q}
            value={answers.questions[i]}
            onChange={(v) => update('questions', answers.questions.map((x, xi) => (xi === i ? v : x)))}
            result={result ? result.questions[i] : null}
            objectiveLabel={q.objective}
          />
        ))}
      </section>

      <section className="ws-part">
        <h4><span className="ws-part-letter">C</span> Vận dụng</h4>
        <p className="ws-prompt">{ws.apply.prompt}</p>
        {ws.apply.hint && <p className="small muted">Gợi ý: {ws.apply.hint}</p>}
        <textarea rows={4} maxLength={240} value={answers.applyText} onChange={(e) => update('applyText', e.target.value)} disabled={locked} aria-label="Câu trả lời vận dụng" />
        <p className="small muted">{answers.applyText.length}/240 kí tự. Viết xong, em tự đối chiếu với tiêu chí rồi chọn mức của mình:</p>
        <div className="ws-rubric" role="radiogroup" aria-label="Tự đánh giá phần vận dụng">
          {ws.apply.rubric.map((r, i) => (
            <label key={i} className={`ws-option ${answers.applyLevel === i + 1 ? 'is-picked' : ''}`}>
              <input type="radio" name={`${ws.slug}-rubric`} checked={answers.applyLevel === i + 1} onChange={() => update('applyLevel', i + 1)} disabled={locked} />
              <span><strong>Mức {i + 1}.</strong> {r}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="ws-part">
        <h4><span className="ws-part-letter">D</span> Tự đánh giá</h4>
        {ws.objectives.map((o, i) => (
          <div key={o.id} className="ws-conf">
            <span><strong>{o.id}</strong> {o.text}</span>
            <div className="ws-seg" role="radiogroup" aria-label={`Mức tự tin ${o.id}`}>
              {CONFIDENCE.map((label, ci) => (
                <button type="button" key={ci} role="radio" aria-checked={answers.confidence[i] === ci + 1} disabled={locked} onClick={() => update('confidence', answers.confidence.map((c, cj) => (cj === i ? ci + 1 : c)))}>
                  {ci + 1}. {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ws-part">
        <h4><span className="ws-part-letter">E</span> Phản tư</h4>
        <label className="ws-field">
          Điều em còn băn khoăn là…
          <input value={answers.doubts} maxLength={160} onChange={(e) => update('doubts', e.target.value)} disabled={locked} />
        </label>
        <label className="ws-field">
          Em có dùng AI khi làm phiếu này không? Dùng thế nào?
          <input value={answers.aiUse} maxLength={100} onChange={(e) => update('aiUse', e.target.value)} disabled={locked} />
        </label>
      </section>

      {error && <p className="ws-error" role="alert">{error}</p>}
      {!submitted && (
        <div className="ws-actions ws-submit">
          <button type="button" className="btn btn-primary" onClick={submit}>
            Nộp phiếu và xem kết quả
          </button>
          <span className="small muted">Bài làm được lưu tự động trên máy này.</span>
        </div>
      )}
      {result && <ResultPanel ws={ws} result={result} code={code} onRetry={retry} />}
    </div>
  );
}
