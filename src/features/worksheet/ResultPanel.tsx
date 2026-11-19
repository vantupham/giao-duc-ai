import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Worksheet, WorksheetResult } from './types';
import { MASTERY_LABEL } from './types';

interface ResultPanelProps {
  ws: Worksheet;
  result: WorksheetResult;
  code: string;
  onRetry: () => void;
  /** Ẩn danh sách mức đạt khi nơi gọi đã hiện thẻ thành tích riêng. */
  hideMastery?: boolean;
}

/** Kết quả theo mục tiêu + mã QR để nộp cho giáo viên. */
export function ResultPanel({ ws, result, code, onRetry, hideMastery = false }: ResultPanelProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(code, { errorCorrectionLevel: 'L', margin: 2, width: 360 })
      .then(setQr)
      .catch(() => setQrError('Không tạo được mã QR trên máy này. Em hãy dùng nút “Sao chép mã” để gửi cho thầy cô.'));
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
      window.prompt('Sao chép mã dưới đây:', code);
    }
  };

  const weak = result.objectives.filter((o) => o.mastery === 'chua-dat');
  const overconfident = result.objectives.filter((o) => o.mastery === 'chua-dat' && o.confidence >= 3);

  return (
    <section className="ws-result" aria-live="polite">
      {!hideMastery && (
        <>
      <h3>Kết quả của em</h3>
      <p className="muted small">
        Phần tổng hợp: đúng {result.summary.correct}/{result.summary.total} chỗ trống. Website không cho điểm; thầy cô xem mức đạt của từng mục tiêu.
      </p>
      <ul className="ws-mastery">
        {result.objectives.map((o) => {
          const obj = ws.objectives.find((x) => x.id === o.id);
          return (
            <li key={o.id} className={`ws-m-${o.mastery}`}>
              <span className="ws-m-badge">{MASTERY_LABEL[o.mastery]}</span>
              <span>
                <strong>{o.id}.</strong> {obj?.text}
                <span className="muted small"> · đúng {o.correct}/{o.total} câu</span>
              </span>
            </li>
          );
        })}
      </ul>
        </>
      )}
      {weak.length > 0 && (
        <p className="ws-advice">
          Em nên đọc lại phần kiến thức gắn với {weak.map((o) => o.id).join(', ')} và thử lại mô phỏng trong bài.
          {overconfident.length > 0 && ' Em đã chọn mức tự tin cao ở mục tiêu này: hãy hỏi thầy cô hoặc bạn bên cạnh để kiểm tra lại cách hiểu.'}
        </p>
      )}
      <div className="ws-qr">
        <div className="ws-qr-img">
          {qr ? <img src={qr} alt="Mã QR chứa kết quả phiếu học tập" width={300} height={300} /> : <p className="muted">{qrError ?? 'Đang tạo mã QR…'}</p>}
        </div>
        <div>
          <h4>Nộp phiếu cho thầy cô</h4>
          <ol className="small">
            <li>Tăng độ sáng màn hình.</li>
            <li>Đưa mã QR này lên trước camera của máy thầy cô (trang “Tổng hợp phiếu”).</li>
            <li>Chờ thầy cô xác nhận đã nhận phiếu của em.</li>
          </ol>
          <div className="ws-actions">
            <button type="button" className="btn" onClick={copy}>
              {copied ? 'Đã sao chép mã' : 'Sao chép mã'}
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              In phiếu
            </button>
            <button type="button" className="btn" onClick={onRetry}>
              Làm lại
            </button>
          </div>
          <p className="small muted">Mã chỉ chứa câu trả lời trong phiếu này, không chứa dữ liệu nào khác trên máy em.</p>
        </div>
      </div>
    </section>
  );
}
