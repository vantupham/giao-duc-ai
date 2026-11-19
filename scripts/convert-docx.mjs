// Chuyển tài liệu học tập (.docx) và slide (.pptx) thành dữ liệu cho website.
// Chạy: npm run convert  (mặc định đọc thư mục ../Tai_lieu_hoc_tap và ../Slide_bai_giang)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDocx } from './docx-reader.mjs';
import { readPptx } from './pptx-reader.mjs';
import { structureGrade, lessonSlug } from './structure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, process.argv[2] ?? '..');
const DOCS_DIR = join(SRC, 'Tai_lieu_hoc_tap');
const SLIDES_DIR = join(SRC, 'Slide_bai_giang');
const OUT_CONTENT = join(ROOT, 'src', 'content', 'generated');
const OUT_PUBLIC = join(ROOT, 'public');

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 1) + '\n', 'utf8');
}

function convertGrade(grade) {
  const file = join(DOCS_DIR, `Tai_lieu_hoc_tap_Giao_duc_AI_Khoi_${grade}.docx`);
  if (!existsSync(file)) throw new Error(`Không tìm thấy tài liệu khối ${grade}: ${file}`);
  const { blocks, media } = readDocx(readFileSync(file));
  const { topics, lessons, sources } = structureGrade(grade, blocks);

  const mediaDir = join(OUT_PUBLIC, 'media', `k${grade}`);
  rmSync(mediaDir, { recursive: true, force: true });
  mkdirSync(mediaDir, { recursive: true });
  for (const [name, data] of media) writeFileSync(join(mediaDir, name.split('/').pop()), data);

  writeJson(join(OUT_CONTENT, 'grades', `k${grade}.json`), { grade, topics, sources });
  for (const lesson of lessons) writeJson(join(OUT_CONTENT, 'lessons', `${lesson.slug}.json`), lesson);
  return { topics: topics.length, lessons: lessons.length, sources: sources.length, media: media.size };
}

function convertSlides() {
  const outDir = join(OUT_PUBLIC, 'slides');
  mkdirSync(outDir, { recursive: true });
  const teaching = {};
  for (const gradeDir of readdirSync(SLIDES_DIR)) {
    for (const f of readdirSync(join(SLIDES_DIR, gradeDir))) {
      const m = f.match(/^Slide_Bai_(\d+)\.(\d+)_.*\.pptx$/);
      if (!m) continue;
      const slug = lessonSlug(m[1], m[2]);
      const src = join(SLIDES_DIR, gradeDir, f);
      copyFileSync(src, join(outDir, `${slug}.pptx`));
      teaching[slug] = readPptx(readFileSync(src));
    }
  }
  writeJson(join(OUT_CONTENT, 'teaching.json'), teaching);
  return Object.keys(teaching).length;
}

for (const grade of [10, 11, 12]) {
  const r = convertGrade(grade);
  console.log(`Khối ${grade}: ${r.topics} chuyên đề, ${r.lessons} bài, ${r.sources} nguồn, ${r.media} hình`);
}
console.log(`Slide: ${convertSlides()} tệp`);
