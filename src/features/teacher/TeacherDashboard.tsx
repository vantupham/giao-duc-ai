import { useEffect, useMemo, useState } from 'react';
import { decodeSubmission } from '../worksheet/codec';
import { codeFromHash, extractCode } from '../worksheet/submitLink';
import { worksheets, getWorksheet } from '../worksheet/registry';
import { aggregate, upsert, toCsv, submissionKey, type Store, type StoredSubmission } from './aggregate';
import { loadJson, saveJson, isObject } from '../../lib/storage';
import { Scanner } from './Scanner';
import { ClassReport } from './ClassReport';
import './dashboard.css';

const STORE_KEY = 'gdai.teacher.results';
const isStore = (v: unknown): v is Store => isObject(v) && Object.values(v).every((x) => isObject(x) && typeof x.slug === 'string');
/** Luôn đọc lại từ bộ nhớ: nhiều tab Tổng hợp phiếu (mở từ nhiều link) không ghi đè phiếu của nhau. */
const readStore = (): Store => loadJson(STORE_KEY, {}, isStore);

interface Toast {
  kind: 'ok' | 'bad';
  text: string;
}

export default function TeacherDashboard() {
  const [store, setStore] = useState<Store>({});
  const [className, setClassName] = useState('');
  const [slug, setSlug] = useState(worksheets[0]?.slug ?? '');
  const [toast, setToast] = useState<Toast | null>(null);
  const [paste, setPaste] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);


  const classes = useMemo(() => [...new Set(Object.values(store).map((s) => s.className))].sort(), [store]);

  useEffect(() => {
    if (!className && classes.length) setClassName(classes[0]);
  }, [classes, className]);

  const receive = (text: string) => {
    const res = decodeSubmission(extractCode(text));
    if (!res.ok) {
      setToast({ kind: 'bad', text: res.error });
      return;
    }
    const ws = getWorksheet(res.data.slug);
    if (!ws) {
      setToast({ kind: 'bad', text: `Phiếu của bài ${res.data.slug} chưa có trên website này.` });
      return;
    }
    if (res.data.version !== ws.version) {
      setToast({ kind: 'bad', text: 'Học sinh đang dùng phiên bản phiếu cũ. Nhờ em tải lại trang và làm lại.' });
      return;
    }
    if (!res.data.className || !res.data.studentNo) {
      setToast({ kind: 'bad', text: 'Phiếu thiếu lớp hoặc số thứ tự.' });
      return;
    }
    const sub: StoredSubmission = { ...res.data, className: res.data.className.toUpperCase(), receivedAt: Date.now() };
    const current = readStore();
    const existed = Boolean(current[submissionKey(sub)]);
    const next = upsert(current, sub);
    setStore(next);
    if (!saveJson(STORE_KEY, next)) setToast({ kind: 'bad', text: 'Đã nhận phiếu nhưng trình duyệt không cho lưu. Hãy xuất CSV trước khi đóng trang.' });
    else setToast({ kind: 'ok', text: `${existed ? 'Cập nhật' : 'Đã nhận'}: ${sub.className} · số ${sub.studentNo}${sub.name ? ` · ${sub.name}` : ''} · Bài ${ws.lessonId}` });
    setClassName(sub.className);
    setSlug(sub.slug);
    setLastKey(submissionKey(sub));
  };

  // mở từ link nộp phiếu (…/tong-hop-phieu/#nop=GDAI1:…): nhận phiếu rồi xóa mã khỏi thanh địa chỉ
  useEffect(() => {
    setStore(readStore());
    const fromLink = codeFromHash(window.location.hash);
    if (fromLink) {
      receive(fromLink);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // phiếu nhận ở tab khác cũng hiện ngay ở tab này
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setStore(readStore());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi mở trang
  }, []);

  const ws = getWorksheet(slug);
  const subs = Object.values(store).filter((s) => s.className === className && s.slug === slug);
  const agg = ws ? aggregate(ws, subs) : null;

  const exportCsv = () => {
    if (!ws || !agg) return;
    const blob = new Blob(['﻿' + toCsv(ws, agg)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phieu-${className}-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearCurrent = () => {
    if (!window.confirm(`Xóa ${subs.length} phiếu của lớp ${className}, bài ${ws?.lessonId}? Không khôi phục được.`)) return;
    const next = Object.fromEntries(Object.entries(store).filter(([, s]) => !(s.className === className && s.slug === slug)));
    setStore(next);
    saveJson(STORE_KEY, next);
  };

  const undoLast = () => {
    if (!lastKey) return;
    const { [lastKey]: _removed, ...rest } = store;
    setStore(rest);
    saveJson(STORE_KEY, rest);
    setLastKey(null);
    setToast({ kind: 'ok', text: 'Đã hủy phiếu vừa quét.' });
  };

  return (
    <div className="td">
      <div className="td-top">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Nhận phiếu</h2>
          <Scanner onCode={receive} />
          {toast && (
            <div className={`td-toast td-toast-${toast.kind}`} role="status">
              {toast.text}
              {toast.kind === 'ok' && lastKey && (
                <button type="button" className="btn" onClick={undoLast}>
                  Hủy phiếu này
                </button>
              )}
            </div>
          )}
          <form
            className="td-paste"
            onSubmit={(e) => {
              e.preventDefault();
              receive(paste);
              setPaste('');
            }}
          >
            <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Hoặc dán mã GDAI1:… hay link nộp phiếu vào đây" aria-label="Dán mã phiếu" />
            <button type="submit" className="btn" disabled={!paste.trim()}>
              Nhận
            </button>
          </form>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Xem báo cáo</h2>
          <div className="td-filters">
            <label>
              Lớp
              <select value={className} onChange={(e) => setClassName(e.target.value)}>
                {classes.length === 0 && <option value="">(chưa có)</option>}
                {classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Bài
              <select value={slug} onChange={(e) => setSlug(e.target.value)}>
                {worksheets.map((w) => (
                  <option key={w.slug} value={w.slug}>
                    Bài {w.lessonId}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ws-actions">
            <button type="button" className="btn" onClick={exportCsv} disabled={subs.length === 0}>
              Xuất Excel (CSV)
            </button>
            <button type="button" className="btn" onClick={clearCurrent} disabled={subs.length === 0}>
              Xóa dữ liệu lớp – bài này
            </button>
          </div>
          <p className="small muted">Dữ liệu chỉ lưu trong trình duyệt của máy này. Nhớ xuất CSV sau mỗi buổi để lưu vào hồ sơ học tập.</p>
        </div>
      </div>
      {ws && agg && <ClassReport ws={ws} agg={agg} />}
    </div>
  );
}
