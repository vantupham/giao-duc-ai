import { lazy, Suspense, useEffect, useState } from 'react';
import { PARTS, ITEMS, BIN_LABEL, type PartKey, type TrashItem } from './stationData';
import { hasWebGL } from '../../../lib/webgl';
import './station.css';

const StationScene = lazy(() => import('./StationScene'));

export default function RecyclingStation() {
  const [selected, setSelected] = useState<PartKey | null>(null);
  const [goalChanged, setGoalChanged] = useState(false);
  const [item, setItem] = useState<TrashItem | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reports, setReports] = useState<string[]>([]);

  useEffect(() => setWebgl(hasWebGL()), []);

  const prediction = item ? (goalChanged ? item.newModel : item.oldModel) : null;
  const screenText = prediction ? `${BIN_LABEL[prediction.bin]}. Mức chắc chắn: ${prediction.confidence}%` : 'Đưa rác trước camera…';
  const wrong = item && prediction ? prediction.bin !== item.truth : false;
  const part = PARTS.find((p) => p.key === selected) ?? null;

  const report = () => {
    if (!item) return;
    setReports((r) => [`${item.name}: máy nói “${BIN_LABEL[prediction!.bin]}”, đúng ra là “${BIN_LABEL[item.truth]}”`, ...r].slice(0, 5));
    setSelected('feedback');
  };

  return (
    <div className="st">
      <div className="st-toolbar">
        <div className="ws-seg" role="group" aria-label="Chọn thành phần">
          {PARTS.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={selected === p.key} onClick={() => setSelected(p.key)}>
              {p.name}
            </button>
          ))}
        </div>
        <label className="st-switch">
          <input type="checkbox" checked={goalChanged} onChange={(e) => setGoalChanged(e.target.checked)} />
          Mục tiêu mới: nhận biết thêm rác <strong>nguy hại</strong>
        </label>
      </div>

      <div className="st-stage">
        <div className="st-canvas">
          {webgl === false && <p className="muted small">Máy này không hỗ trợ đồ họa 3D (WebGL). Em dùng các nút phía trên để xem từng thành phần.</p>}
          {webgl && (
            <Suspense fallback={<div className="st-loading">Đang dựng trạm 3D…</div>}>
              <StationScene selected={selected} goalChanged={goalChanged} screenText={screenText} activeBin={prediction?.bin ?? null} onSelect={setSelected} />
            </Suspense>
          )}
          <p className="small muted">Kéo để xoay, cuộn để phóng to. Các hạt vàng là dòng dữ liệu chạy theo vòng khép kín.</p>
        </div>

        <aside className="st-panel" aria-live="polite">
          {part ? (
            <>
              <h4 style={{ color: part.color }}>{part.name}</h4>
              <p>{part.definition}</p>
              <dl>
                <dt>Ở trạm phân loại rác</dt>
                <dd>{part.atStation}</dd>
                <dt>Trong chuyện ôn thi của Lan</dt>
                <dd>{part.lan}</dd>
                <dt>Con người ở đâu?</dt>
                <dd>{part.human}</dd>
                {goalChanged && (
                  <>
                    <dt>Khi thêm nhóm “nguy hại”</dt>
                    <dd className={part.change.must ? 'st-must' : 'st-keep'}>{part.change.how}</dd>
                  </>
                )}
              </dl>
            </>
          ) : (
            <>
              <h4>Bấm vào một bộ phận</h4>
              <p className="muted">Bên trong trạm có năm thành phần: dữ liệu, thuật toán, mô hình, đầu ra, phản hồi. Camera và màn hình chỉ là thiết bị; phần “biết phân loại” nằm ở mô hình.</p>
            </>
          )}
        </aside>
      </div>

      <div className="st-try">
        <h4>Thử đưa rác vào trạm</h4>
        <div className="st-items">
          {ITEMS.map((it) => (
            <button key={it.id} type="button" className={`st-item ${item?.id === it.id ? 'is-on' : ''}`} onClick={() => setItem(it)}>
              <span aria-hidden="true">{it.icon}</span> {it.name}
            </button>
          ))}
        </div>
        {item && prediction && (
          <div className={`st-result ${wrong ? 'bad' : 'ok'}`}>
            <p>
              Màn hình: <strong>{screenText}</strong>. Thực tế: <strong>{BIN_LABEL[item.truth]}</strong>.
            </p>
            {wrong && item.id === 'pin' && !goalChanged && (
              <p>Mô hình cũ chưa từng “thấy” pin trong dữ liệu nên đoán sai, mà còn khá chắc chắn. Hãy bật “Mục tiêu mới” để xem điều gì phải đổi.</p>
            )}
            {wrong && item.id !== 'pin' && <p>Mức chắc chắn thấp là dấu hiệu máy đang “đoán mò”. Đầu ra là phỏng đoán có căn cứ, không phải chân lí.</p>}
            {wrong && (
              <button type="button" className="btn" onClick={report}>
                Bấm “Sai rồi” (gửi phản hồi)
              </button>
            )}
          </div>
        )}
        {reports.length > 0 && (
          <div className="st-reports small">
            <strong>Danh sách báo sai chờ người phụ trách xử lí cuối tuần:</strong>
            <ul>
              {reports.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <p className="muted">Phản hồi chỉ có ích khi có người gán lại nhãn đúng và đưa các ảnh này vào dữ liệu để máy học thêm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
