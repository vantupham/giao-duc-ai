// Hành vi phía trình duyệt của trang bài v2. Mỗi phần độc lập, lỗi ở phần này không làm hỏng phần khác.

import { loadProgress, updateProgress, PROGRESS_EVENT } from '../progress/store';
import { markLab, markSection, visitLesson } from '../progress/progress';
import { buildTermMatcher, termKey } from '../glossary/match';

interface TermEntry {
  term: string;
  def: string;
  from: string;
}

const MOBILE = '(max-width: 820px)';

function readingBar() {
  const bar = document.querySelector<HTMLElement>('[data-read-bar]');
  const body = document.querySelector<HTMLElement>('.lx-article');
  if (!bar || !body) return;
  let queued = false;
  const paint = () => {
    queued = false;
    const r = body.getBoundingClientRect();
    const total = r.height - innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    bar.style.transform = `scaleX(${done})`;
  };
  addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paint);
    }
  }, { passive: true });
  paint();
}

function trackReading(slug: string) {
  updateProgress((p) => visitLesson(p, slug, Date.now()));
  const paintToc = () => {
    const read = new Set(loadProgress().lessons[slug]?.sections ?? []);
    const labs = new Set(loadProgress().lessons[slug]?.labs ?? []);
    document.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((a) => a.classList.toggle('is-read', read.has(a.dataset.tocLink!)));
    document.querySelectorAll<HTMLElement>('[data-toc-lab]').forEach((a) => a.classList.toggle('is-read', labs.has(a.dataset.tocLab!)));
  };
  paintToc();
  addEventListener(PROGRESS_EVENT, paintToc);

  // một mục tính là đã đọc khi cuối mục lọt vào màn hình
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = (e.target as HTMLElement).dataset.sentinel!;
      updateProgress((p) => markSection(p, slug, id, Date.now()));
      io.unobserve(e.target);
    }
  });
  document.querySelectorAll('[data-sentinel]').forEach((el) => io.observe(el));

  // mô phỏng tính là đã thử khi em chạm vào nó lần đầu
  document.querySelectorAll<HTMLElement>('[data-lab-key]').forEach((el) =>
    el.addEventListener('pointerdown', () => updateProgress((p) => markLab(p, slug, el.dataset.labKey!, Date.now())), { once: true }),
  );
}

function scrollSpy() {
  const links = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-toc] a').forEach((a) => links.set(a.getAttribute('href')!.slice(1), a));
  const targets = [...links.keys()].map((id) => document.getElementById(id)).filter((x): x is HTMLElement => Boolean(x));
  const io = new IntersectionObserver(
    (entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!top) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(top.target.id)?.setAttribute('aria-current', 'true');
    },
    { rootMargin: '-80px 0px -65% 0px' },
  );
  targets.forEach((t) => io.observe(t));
}

function tocSheet() {
  const sheet = document.querySelector<HTMLDialogElement>('[data-toc-sheet]');
  const toc = document.querySelector<HTMLElement>('[data-toc]');
  const body = document.querySelector<HTMLElement>('[data-toc-sheet-body]');
  if (!sheet || !toc || !body) return;
  body.append(toc.querySelector('ol')!.cloneNode(true));
  document.querySelector('[data-toc-open]')?.addEventListener('click', () => sheet.showModal());
  document.querySelector('[data-toc-close]')?.addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || (e.target as HTMLElement).closest('a')) sheet.close();
  });
}

function collapseGoalsOnMobile() {
  const goals = document.querySelector<HTMLDetailsElement>('[data-goals]');
  if (goals && matchMedia(MOBILE).matches) goals.open = false;
}

/** Biến thuật ngữ đầu tiên xuất hiện trong bài thành nút bấm xem nghĩa. */
function glossaryTerms() {
  const raw = document.getElementById('gdai-terms')?.textContent;
  const root = document.querySelector<HTMLElement>('[data-lesson-body]');
  const pop = document.querySelector<HTMLElement>('[data-term-pop]');
  if (!raw || !root || !pop) return;
  let entries: TermEntry[];
  try {
    entries = JSON.parse(raw) as TermEntry[];
  } catch {
    return;
  }
  const byKey = new Map(entries.map((e) => [termKey(e.term), e]));
  const match = buildTermMatcher(entries.map((e) => e.term));
  const used = new Set<string>();
  const SKIP = 'a, button, h2, h3, .box-title, .lab, astro-island, [data-no-terms], table, figcaption, .teacher-panel';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const text = node.data;
    const hits = match(text).filter((h) => byKey.has(h.key) && !used.has(h.key));
    if (!hits.length) continue;
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const h of hits) {
      if (used.has(h.key) || h.start < pos) continue;
      used.add(h.key);
      frag.append(text.slice(pos, h.start));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lx-term';
      btn.dataset.term = h.key;
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = text.slice(h.start, h.end);
      frag.append(btn);
      pos = h.end;
    }
    frag.append(text.slice(pos));
    node.replaceWith(frag);
  }

  let openBtn: HTMLButtonElement | null = null;
  const close = () => {
    pop.hidden = true;
    openBtn?.setAttribute('aria-expanded', 'false');
    openBtn = null;
  };
  const open = (btn: HTMLButtonElement) => {
    const e = byKey.get(btn.dataset.term!);
    if (!e) return;
    pop.querySelector('[data-term-t]')!.textContent = e.term;
    pop.querySelector('[data-term-d]')!.textContent = e.def;
    pop.querySelector('[data-term-from]')!.textContent = `Thuật ngữ · ${e.from}`;
    pop.hidden = false;
    const r = btn.getBoundingClientRect();
    const w = pop.offsetWidth;
    pop.style.left = `${Math.min(Math.max(8, r.left + scrollX + r.width / 2 - w / 2), scrollX + document.documentElement.clientWidth - w - 8)}px`;
    pop.style.top = `${r.bottom + scrollY + 8}px`;
    btn.setAttribute('aria-expanded', 'true');
    openBtn = btn;
  };
  root.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('.lx-term');
    if (!btn) return;
    if (openBtn === btn) close();
    else {
      close();
      open(btn);
    }
  });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (openBtn && !t.closest('.lx-term') && !t.closest('[data-term-pop]')) close();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && openBtn) {
      const b = openBtn;
      close();
      b.focus();
    }
  });
}

function safely(name: string, fn: () => void) {
  try {
    fn();
  } catch (err) {
    // một tính năng phụ hỏng thì bài học vẫn đọc được bình thường
    console.error(`[bài học v2] ${name}:`, err);
  }
}

export function initLessonV2(): void {
  const slug = document.querySelector<HTMLElement>('[data-lesson]')?.dataset.lesson;
  if (!slug) return;
  safely('thanh tiến độ', readingBar);
  safely('tiến độ đọc', () => trackReading(slug));
  safely('mục lục', scrollSpy);
  safely('bảng mục lục', tocSheet);
  safely('mục tiêu', collapseGoalsOnMobile);
  safely('thuật ngữ', glossaryTerms);
}
