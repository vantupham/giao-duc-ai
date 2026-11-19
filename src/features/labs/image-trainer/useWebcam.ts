import { useCallback, useEffect, useRef, useState } from 'react';

export type CamState = 'off' | 'starting' | 'on' | 'error';

/** Bật/tắt webcam; luôn tắt khi rời trang. */
export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('off');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState('off');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setError('Trình duyệt này không cho dùng webcam. Em có thể dùng nút “Tải ảnh lên”.');
      return;
    }
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('on');
      setError(null);
    } catch (e: unknown) {
      setState('error');
      const name = e instanceof DOMException ? e.name : '';
      setError(name === 'NotAllowedError' ? 'Em chưa cho phép dùng camera. Bấm vào biểu tượng camera trên thanh địa chỉ để cho phép.' : 'Không mở được camera. Em có thể dùng nút “Tải ảnh lên”.');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, state, error, start, stop };
}
