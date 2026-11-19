import { useEffect, useRef, useState } from 'react';

interface ScannerProps {
  onCode: (text: string) => void;
}

/** Quét mã QR bằng webcam của máy giáo viên (thư viện qr-scanner, xử lí trên máy). */
export function Scanner({ onCode }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!on || !videoRef.current) return;
    let scanner: { start: () => Promise<void>; stop: () => void; destroy: () => void } | null = null;
    let cancelled = false;
    let last = '';
    let lastAt = 0;
    (async () => {
      try {
        const { default: QrScanner } = await import('qr-scanner');
        if (cancelled || !videoRef.current) return;
        scanner = new QrScanner(
          videoRef.current,
          (res: { data: string }) => {
            const now = Date.now();
            if (res.data === last && now - lastAt < 4000) return;
            last = res.data;
            lastAt = now;
            onCodeRef.current(res.data);
          },
          { highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 8, preferredCamera: 'user' },
        );
        await scanner.start();
        setError(null);
      } catch {
        setError('Không mở được camera. Hãy cho phép trình duyệt dùng camera, hoặc dán mã vào ô bên dưới.');
        setOn(false);
      }
    })();
    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [on]);

  return (
    <div className="td-scanner">
      <div className="td-video" hidden={!on}>
        <video ref={videoRef} muted playsInline aria-label="Camera quét mã QR" />
      </div>
      <button type="button" className={`btn ${on ? '' : 'btn-primary'}`} onClick={() => setOn((v) => !v)}>
        {on ? 'Tắt camera' : '📷 Bật camera quét mã'}
      </button>
      {error && <p className="small" style={{ color: 'var(--bad)' }}>{error}</p>}
    </div>
  );
}
