import { useEffect, useRef, useState } from 'react';
import { createTrainer, thumbnail, type Trainer, type Prediction } from './trainer';
import { useWebcam } from './useWebcam';
import './trainer.css';

interface ClassInfo {
  name: string;
  thumbs: string[];
}

const MODEL_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/models/mobilenet-v2-050/model.json`;
const CAPTURE_MS = 160;
const MAX_THUMBS = 24;

export default function ImageTrainer() {
  const { videoRef, state: cam, error: camError, start, stop } = useWebcam();
  const trainerRef = useRef<Trainer | null>(null);
  const [modelState, setModelState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [classes, setClasses] = useState<ClassInfo[]>([{ name: 'Tái chế', thumbs: [] }, { name: 'Hữu cơ', thumbs: [] }, { name: 'Còn lại', thumbs: [] }]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [capturing, setCapturing] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [feedbackLog, setFeedbackLog] = useState(0);

  const ensureModel = async () => {
    if (trainerRef.current || modelState === 'loading') return;
    setModelState('loading');
    try {
      trainerRef.current = await createTrainer(MODEL_URL);
      setModelState('ready');
    } catch {
      setModelState('error');
    }
  };

  const begin = async () => {
    await Promise.all([start(), ensureModel()]);
  };

  const addFrom = (src: HTMLVideoElement | HTMLImageElement, label: number) => {
    const t = trainerRef.current;
    if (!t) return;
    t.addExample(src, label);
    const thumb = thumbnail(src);
    setClasses((cs) => cs.map((c, i) => (i === label ? { ...c, thumbs: [thumb, ...c.thumbs].slice(0, MAX_THUMBS) } : c)));
    setCounts(t.counts());
  };

  // Giữ nút để chụp liên tục.
  useEffect(() => {
    if (capturing === null) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (v && v.readyState >= 2) addFrom(v, capturing);
    }, CAPTURE_MS);
    return () => window.clearInterval(id);
  }, [capturing]);

  // Dự đoán liên tục khi đã có ít nhất hai nhóm có ảnh.
  useEffect(() => {
    if (cam !== 'on' || modelState !== 'ready') return;
    let alive = true;
    let timer = 0;
    const loop = async () => {
      const v = videoRef.current;
      const t = trainerRef.current;
      if (v && t && v.readyState >= 2) setPrediction(await t.predict(v));
      if (alive) timer = window.setTimeout(loop, 250);
    };
    loop();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cam, modelState]);

  useEffect(() => () => trainerRef.current?.dispose(), []);

  const upload = async (files: FileList | null, label: number) => {
    if (!files) return;
    await ensureModel();
    for (const f of Array.from(files).slice(0, 30)) {
      const img = new Image();
      img.src = URL.createObjectURL(f);
      await img.decode().catch(() => null);
      if (img.width) addFrom(img, label);
      URL.revokeObjectURL(img.src);
    }
  };

  const clearClass = (i: number) => {
    trainerRef.current?.clearLabel(i);
    setClasses((cs) => cs.map((c, j) => (j === i ? { ...c, thumbs: [] } : c)));
    setCounts(trainerRef.current?.counts() ?? {});
  };

  const fixWith = (label: number) => {
    const v = videoRef.current;
    if (v && v.readyState >= 2) {
      addFrom(v, label);
      setFeedbackLog((n) => n + 1);
    }
  };

  const trainedClasses = Object.values(counts).filter((n) => n > 0).length;
  const top = prediction ? classes[prediction.label]?.name : null;
  const topConf = prediction ? Math.round((prediction.confidences[prediction.label] ?? 0) * 100) : 0;

  return (
    <div className="it">
      <p className="small muted">
        Ảnh từ webcam chỉ được xử lí ngay trên máy em, không gửi đi đâu và mất khi em rời trang. Chỉ chụp đồ vật, không chụp khuôn mặt các bạn.
      </p>
      <div className="it-grid">
        <section className="it-card it-data">
          <h4><span className="it-num">1</span> Dữ liệu: ảnh đã gán nhãn</h4>
          {classes.map((c, i) => (
            <div key={i} className="it-class">
              <div className="it-class-head">
                <input value={c.name} maxLength={20} aria-label={`Tên nhóm ${i + 1}`} onChange={(e) => setClasses((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <span className="small muted">{counts[i] ?? 0} ảnh</span>
              </div>
              <div className="it-thumbs">
                {c.thumbs.map((t, k) => (
                  <img key={k} src={t} alt="" width={36} height={36} />
                ))}
              </div>
              <div className="it-class-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={cam !== 'on' || modelState !== 'ready'}
                  onPointerDown={() => setCapturing(i)}
                  onPointerUp={() => setCapturing(null)}
                  onPointerLeave={() => setCapturing(null)}
                >
                  {capturing === i ? 'Đang chụp…' : 'Giữ để chụp'}
                </button>
                <label className="btn">
                  Tải ảnh lên
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files, i)} />
                </label>
                {(counts[i] ?? 0) > 0 && (
                  <button type="button" className="btn" onClick={() => clearClass(i)}>
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
          {classes.length < 5 && (
            <button type="button" className="btn" onClick={() => setClasses((cs) => [...cs, { name: `Nhóm ${cs.length + 1}`, thumbs: [] }])}>
              + Thêm nhóm
            </button>
          )}
        </section>

        <section className="it-card">
          <h4><span className="it-num">2</span> Thuật toán: cách học</h4>
          <p className="small">
            Máy biến mỗi ảnh thành một dãy số đặc trưng, rồi khi gặp ảnh mới sẽ tìm <strong>10 ảnh giống nhất</strong> trong dữ liệu (k láng giềng gần nhất). Nhóm nào có nhiều ảnh giống nhất thì đoán là nhóm đó.
          </p>
          <h4><span className="it-num">3</span> Mô hình: kết quả của việc học</h4>
          <p className="small">
            {trainedClasses >= 2 ? `Bộ nhận biết đã sẵn sàng với ${trainedClasses} nhóm.` : 'Cần ảnh cho ít nhất hai nhóm thì mới có bộ nhận biết.'}
          </p>
          {modelState === 'loading' && <p className="small muted">Đang tải bộ trích đặc trưng (khoảng 8 MB, chỉ tải một lần)…</p>}
          {modelState === 'error' && <p className="small" style={{ color: 'var(--bad)' }}>Không tải được mô hình. Kiểm tra kết nối mạng rồi tải lại trang.</p>}
        </section>

        <section className="it-card it-cam">
          <h4><span className="it-num">4</span> Đầu ra</h4>
          <div className="it-video">
            <video ref={videoRef} playsInline muted aria-label="Hình từ webcam" />
            {cam !== 'on' && (
              <div className="it-video-cover">
                <button type="button" className="btn btn-primary" onClick={begin} disabled={cam === 'starting'}>
                  {cam === 'starting' ? 'Đang mở camera…' : 'Bật webcam'}
                </button>
              </div>
            )}
          </div>
          {camError && <p className="small" style={{ color: 'var(--bad)' }}>{camError}</p>}
          <div className="it-output" aria-live="polite">
            {top ? (
              <>
                <strong>{top}.</strong> Mức chắc chắn: {topConf}%
              </>
            ) : (
              <span className="muted">Chưa có dự đoán</span>
            )}
          </div>
          {prediction &&
            classes.map((c, i) =>
              (counts[i] ?? 0) > 0 ? (
                <div key={i} className="it-bar">
                  <span>{c.name}</span>
                  <span className="it-bar-track">
                    <span style={{ width: `${Math.round((prediction.confidences[i] ?? 0) * 100)}%` }} />
                  </span>
                </div>
              ) : null,
            )}
          {cam === 'on' && (
            <button type="button" className="btn" onClick={stop} style={{ marginTop: 8 }}>
              Tắt webcam
            </button>
          )}
        </section>

        <section className="it-card">
          <h4><span className="it-num">5</span> Phản hồi</h4>
          <p className="small">Máy đoán sai? Đưa đồ vật trước camera rồi chọn nhóm đúng: ảnh được thêm vào dữ liệu và mô hình học thêm ngay.</p>
          <div className="ws-seg">
            {classes.map((c, i) => (
              <button key={i} type="button" disabled={cam !== 'on' || modelState !== 'ready'} onClick={() => fixWith(i)}>
                Sai rồi, đây là “{c.name}”
              </button>
            ))}
          </div>
          {feedbackLog > 0 && <p className="small muted">Em đã gửi {feedbackLog} phản hồi. Vòng khép kín: phản hồi → dữ liệu → mô hình tốt hơn.</p>}
        </section>
      </div>
      <details className="fold small">
        <summary>Câu hỏi cho nhóm</summary>
        <ol>
          <li>Trên màn hình này, con người có mặt ở những thành phần nào?</li>
          <li>Thử đưa một đồ vật không thuộc nhóm nào. Máy trả lời gì? Vì sao?</li>
          <li>Chỉ chụp đồ vật trên một phông nền, rồi đổi phông nền. Kết quả có đổi không? Máy có thể đã học nhầm điều gì?</li>
        </ol>
      </details>
    </div>
  );
}
