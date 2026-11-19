import { useState } from 'react';
import type { Worksheet } from '../worksheet/types';
import { MASTERY_LABEL } from '../worksheet/types';
import type { Aggregate } from './aggregate';

interface ClassReportProps {
  ws: Worksheet;
  agg: Aggregate;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Báo cáo một lớp – một bài: phân bố mức đạt, bản đồ nhiệt, lỗi hiểu sai, câu khó, băn khoăn. */
export function ClassReport({ ws, agg }: ClassReportProps) {
  const [openMis, setOpenMis] = useState<string | null>(null);
  const n = agg.students.length;
  if (n === 0) return <p className="muted">Chưa có phiếu nào của lớp này cho bài đã chọn. Bật camera và cho học sinh đưa mã QR lên để bắt đầu.</p>;
  const hardest = [...agg.questions].sort((a, b) => a.correctRate - b.correctRate).slice(0, 3);
  const misKey = (m: { questionId: string; text: string }) => `${m.questionId}|${m.text}`;
  const picked = agg.misconceptions.find((m) => misKey(m) === openMis) ?? null;
  const highlighted = new Set(picked?.students.map((x) => x.studentNo) ?? []);

  return (
    <div className="td-report">
      <section>
        <h3>Mức đạt theo mục tiêu ({n} phiếu)</h3>
        {agg.objectives.map((o) => {
          const text = ws.objectives.find((x) => x.id === o.id)?.text;
          return (
            <div key={o.id} className="td-obj">
              <div className="small">
                <strong>{o.id}</strong> {text}
              </div>
              <div className="td-stack" role="img" aria-label={`${o.id}: Tốt ${o.tot}, Đạt ${o.dat}, Chưa đạt ${o['chua-dat']}`}>
                {(['tot', 'dat', 'chua-dat'] as const).map((m) =>
                  o[m] > 0 ? (
                    <span key={m} className={`td-seg td-${m}`} style={{ flex: o[m] }}>
                      {MASTERY_LABEL[m]} {o[m]}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h3>Lỗi hiểu sai phổ biến</h3>
        {agg.misconceptions.length === 0 ? (
          <p className="muted small">Chưa phát hiện lỗi hiểu sai nào.</p>
        ) : (
          <ol className="td-mis">
            {agg.misconceptions.slice(0, 8).map((m) => {
              const qi = ws.questions.findIndex((q) => q.id === m.questionId);
              const key = misKey(m);
              const isOpen = openMis === key;
              return (
                <li key={key} className={isOpen ? 'is-open' : undefined}>
                  <button type="button" className="td-mis-btn" aria-expanded={isOpen} onClick={() => setOpenMis(isOpen ? null : key)}>
                    <span className="td-mis-bar" style={{ width: pct(m.count / n) }} />
                    <span className="td-mis-text">
                      <strong>{pct(m.count / n)}</strong> ({m.count} em) · {m.text} <span className="muted small">· Câu {qi + 1}</span>
                    </span>
                    <span className="td-mis-more small">{isOpen ? 'Ẩn' : 'Xem em nào'}</span>
                  </button>
                  {isOpen && (
                    <p className="td-mis-who">
                      {m.students.map((x) => (
                        <span key={x.studentNo} className="td-who">
                          Số {x.studentNo}
                          {x.name ? ` · ${x.name}` : ''}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="small muted">
          Gợi ý: dành 5 phút đầu tiết sau để sửa lỗi đứng đầu danh sách, dùng lại mô phỏng trong bài. Bấm vào một lỗi để xem những em mắc lỗi đó; các em được tô nổi trên bản đồ nhiệt.
        </p>
      </section>

      <section>
        <h3>Bản đồ nhiệt: học sinh × mục tiêu</h3>
        <div className="table-wrap">
          <table className="td-heat">
            <thead>
              <tr>
                <th>Số TT</th>
                <th>Tên</th>
                <th>Tổng hợp</th>
                {ws.objectives.map((o) => (
                  <th key={o.id}>{o.id}</th>
                ))}
                <th>Vận dụng</th>
              </tr>
            </thead>
            <tbody>
              {agg.students.map(({ sub, result }) => (
                <tr key={sub.studentNo} className={highlighted.has(sub.studentNo) ? 'td-row-hl' : undefined}>
                  <td>{sub.studentNo}</td>
                  <td>{sub.name}</td>
                  <td>
                    {result.summary.correct}/{result.summary.total}
                  </td>
                  {result.objectives.map((o) => (
                    <td key={o.id} className={`td-cell td-${o.mastery}`} title={`Đúng ${o.correct}/${o.total}; tự tin ${o.confidence || '–'}/4`}>
                      {MASTERY_LABEL[o.mastery]}
                      {o.mastery === 'chua-dat' && o.confidence >= 3 && <span title="Tự tin cao nhưng chưa đạt"> ⚠</span>}
                    </td>
                  ))}
                  <td>{sub.answers.applyLevel ? `Mức ${sub.answers.applyLevel}` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">⚠ = em tự tin cao (3–4) nhưng chưa đạt: cần trao đổi riêng. Rê chuột lên ô để xem số câu đúng và mức tự tin.</p>
      </section>

      <div className="grid grid-2">
        <section>
          <h3>Câu khó nhất</h3>
          <ul className="small">
            {hardest.map((q) => {
              const qi = ws.questions.findIndex((x) => x.id === q.id);
              return (
                <li key={q.id}>
                  <strong>Câu {qi + 1}</strong> ({pct(q.correctRate)} đúng): {ws.questions[qi].prompt}
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h3>Học sinh còn băn khoăn</h3>
          {agg.doubts.length === 0 ? (
            <p className="muted small">Chưa có câu hỏi nào.</p>
          ) : (
            <ul className="small">
              {agg.doubts.map((d) => (
                <li key={d.studentNo}>
                  <strong>Số {d.studentNo}:</strong> {d.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <details className="fold">
        <summary>Câu trả lời phần vận dụng và nhật kí dùng AI</summary>
        <p className="small muted">Tiêu chí: {ws.apply.rubric.map((r, i) => `Mức ${i + 1}: ${r}`).join(' · ')}</p>
        <ul className="small">
          {agg.students.map(({ sub }) => (
            <li key={sub.studentNo}>
              <strong>Số {sub.studentNo}</strong> (tự đánh giá mức {sub.answers.applyLevel || '–'}): {sub.answers.applyText || <em className="muted">bỏ trống</em>}
              {sub.answers.aiUse && <span className="muted"> · Dùng AI: {sub.answers.aiUse}</span>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
