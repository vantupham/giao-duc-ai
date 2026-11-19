import { useMemo, useState } from 'react';
import { buildSubmitLink } from './submitLink';

interface SubmitLinkBoxProps {
  code: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

/** Cách nộp thứ hai: một đường link mở trang Tổng hợp phiếu (tab mới) và tự nhận phiếu. */
export function SubmitLinkBox({ code }: SubmitLinkBoxProps) {
  const link = useMemo(() => buildSubmitLink(window.location.origin, import.meta.env.BASE_URL, code), [code]);
  const [copy, setCopy] = useState<CopyState>('idle');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'Phiếu học tập', text: 'Link nộp phiếu học tập của em', url: link });
    } catch (err) {
      // người dùng tự đóng bảng chia sẻ thì không cần báo gì
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await copyLink();
    }
  };

  return (
    <div className="ws-link">
      <h4>
        <span className="ws-link-tag">Cách 2</span> Gửi link cho thầy cô
      </h4>
      <p className="small">
        Gửi link này qua Zalo, Messenger hoặc email. Thầy cô bấm vào link, trang <b>Tổng hợp phiếu</b> mở trong tab mới và tự nhận phiếu của em.
      </p>
      <div className="ws-link-row">
        <input value={link} readOnly aria-label="Link nộp phiếu" onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div className="ws-actions">
        <button type="button" className="btn btn-primary" onClick={copyLink}>
          {copy === 'copied' ? 'Đã sao chép link' : 'Sao chép link'}
        </button>
        {canShare && (
          <button type="button" className="btn" onClick={share}>
            Gửi link…
          </button>
        )}
        <a className="btn" href={link} target="_blank" rel="noopener noreferrer">
          Mở link trong tab mới ↗
        </a>
      </div>
      {copy === 'failed' && (
        <p className="small ws-error" role="alert">
          Trình duyệt không cho sao chép tự động. Em bấm vào ô link ở trên, chọn hết rồi sao chép.
        </p>
      )}
      <p className="small muted">Link chỉ chứa câu trả lời trong phiếu này. Phần mã nằm sau dấu # nên không được gửi lên máy chủ nào.</p>
    </div>
  );
}
