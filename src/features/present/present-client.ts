// Chế độ lên lớp: biến trang bài thành trình chiếu ngay tại chỗ (mô phỏng vẫn chạy), có đồng hồ theo tiến trình.

import { clampIndex, formatClock, phaseAt, type PlanStep } from './plan';
import './present.css';

const PRESENT_CLASS = 'is-present';
const TICK_MS = 1000;

function readPlan(): PlanStep[] {
  try {
    const raw: unknown = JSON.parse(document.getElementById('gdai-plan')?.textContent ?? '[]');
    return Array.isArray(raw) ? raw.filter((p): p is PlanStep => typeof p?.minutes === 'number' && typeof p?.label === 'string') : [];
  } catch {
    return [];
  }
}

/** Phím mũi tên trong ô nhập, thanh trượt hay mô phỏng thì để yên cho thành phần đó dùng. */
const ownsKeys = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || Boolean(t.closest('.lab, .wsx, canvas')));

async function fillEndQr() {
  const link = document.querySelector<HTMLAnchorElement>('[data-end-link]');
  const img = document.querySelector<HTMLImageElement>('[data-end-qr]');
  if (!link || !img || img.src) return;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const href = `${location.origin}${base}/${link.dataset.path}`;
  link.href = href;
  link.textContent = href.replace(/^https?:\/\//, '');
  try {
    const QRCode = (await import('qrcode')).default;
    img.src = await QRCode.toDataURL(href, { errorCorrectionLevel: 'M', margin: 1, width: 600 });
  } catch {
    img.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Không tạo được mã QR. Thầy cô đọc đường link bên dưới cho cả lớp.' }));
  }
}

export function initPresent(): void {
  const root = document.documentElement;
  const startButtons = document.querySelectorAll<HTMLButtonElement>('[data-present-start]');
  const bar = document.querySelector<HTMLElement>('[data-px-bar]');
  if (!startButtons.length || !bar) return;

  const slides = [...document.querySelectorAll<HTMLElement>('[data-slide]')];
  const plan = readPlan();
  const q = <T extends HTMLElement>(sel: string) => bar.querySelector<T>(sel)!;
  let at = 0;
  let elapsed = 0;
  let running = true;
  let timer = 0;

  const paintClock = () => {
    const ph = phaseAt(plan, elapsed);
    q('[data-px-clock]').textContent = formatClock(elapsed);
    q('[data-px-phase]').textContent = ph.isOver ? `Quá giờ ${formatClock(-ph.remaining)}` : `${ph.label} · còn ${formatClock(ph.remaining)}`;
    q('[data-px-fill]').style.transform = `scaleX(${ph.fraction})`;
    bar.classList.toggle('is-over', ph.isOver);
  };

  const show = (i: number) => {
    at = clampIndex(i, slides.length);
    slides.forEach((s, si) => s.classList.toggle('is-slide', si === at));
    q('[data-px-pos]').textContent = `${at + 1}/${slides.length}`;
    q('[data-px-title]').textContent = slides[at].dataset.slideTitle ?? '';
    q<HTMLButtonElement>('[data-px-prev]').disabled = at === 0;
    q<HTMLButtonElement>('[data-px-next]').disabled = at === slides.length - 1;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (slides[at].classList.contains('lx-end')) void fillEndQr();
  };

  const onKey = (e: KeyboardEvent) => {
    if (!root.classList.contains(PRESENT_CLASS) || ownsKeys(e.target)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      show(at + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      show(at - 1);
    } else if (e.key === 'Escape' && !document.fullscreenElement) {
      stop();
    }
  };

  const start = () => {
    root.classList.add(PRESENT_CLASS);
    elapsed = 0;
    running = true;
    q('[data-px-pause]').textContent = 'Dừng giờ';
    paintClock();
    clearInterval(timer);
    timer = window.setInterval(() => {
      if (!running) return;
      elapsed += 1;
      paintClock();
    }, TICK_MS);
    show(0);
    q<HTMLButtonElement>('[data-px-next]').focus();
  };

  const stop = () => {
    const current = slides[at];
    root.classList.remove(PRESENT_CLASS);
    slides.forEach((s) => s.classList.remove('is-slide'));
    clearInterval(timer);
    if (document.fullscreenElement) void document.exitFullscreen();
    current?.scrollIntoView({ block: 'start' });
  };

  startButtons.forEach((b) => b.addEventListener('click', start));
  q('[data-px-prev]').addEventListener('click', () => show(at - 1));
  q('[data-px-next]').addEventListener('click', () => show(at + 1));
  q('[data-px-exit]').addEventListener('click', stop);
  q('[data-px-pause]').addEventListener('click', () => {
    running = !running;
    q('[data-px-pause]').textContent = running ? 'Dừng giờ' : 'Chạy giờ';
  });
  q('[data-px-full]').addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen?.().catch(() => undefined);
  });
  document.addEventListener('fullscreenchange', () => {
    q('[data-px-full]').textContent = document.fullscreenElement ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  });
  document.addEventListener('keydown', onKey);
}
