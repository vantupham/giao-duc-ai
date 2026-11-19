// Đồng hồ lên lớp: đang ở giai đoạn nào của tiến trình 45 phút, còn bao lâu.

export interface PlanStep {
  minutes: number;
  label: string;
}

export interface PhaseInfo {
  /** chỉ số giai đoạn hiện tại; bằng plan.length khi đã quá giờ */
  index: number;
  label: string;
  /** số giây còn lại của giai đoạn hiện tại (âm khi đã quá tổng thời gian) */
  remaining: number;
  totalSeconds: number;
  /** 0..1, phần đã trôi qua của cả tiết */
  fraction: number;
  isOver: boolean;
}

export const DEFAULT_LESSON_MINUTES = 45;

export function phaseAt(plan: readonly PlanStep[], elapsedSeconds: number): PhaseInfo {
  const steps = plan.length ? plan : [{ minutes: DEFAULT_LESSON_MINUTES, label: 'Tiết học' }];
  const totalSeconds = steps.reduce((s, p) => s + p.minutes * 60, 0);
  const t = Math.max(0, elapsedSeconds);
  let end = 0;
  for (let i = 0; i < steps.length; i++) {
    end += steps[i].minutes * 60;
    if (t < end) return { index: i, label: steps[i].label, remaining: end - t, totalSeconds, fraction: t / totalSeconds, isOver: false };
  }
  return { index: steps.length, label: 'Hết giờ', remaining: totalSeconds - t, totalSeconds, fraction: 1, isOver: true };
}

/** 75 → "01:15", -30 → "−00:30" */
export function formatClock(seconds: number): string {
  const sign = seconds < 0 ? '−' : '';
  const s = Math.abs(Math.trunc(seconds));
  return `${sign}${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export const clampIndex = (i: number, n: number): number => Math.max(0, Math.min(n - 1, i));
