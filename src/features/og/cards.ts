// Nội dung ảnh xem trước cho từng trang. Khóa (key) là tên tệp: /og/<key>.png

import { GRADES, GRADE_TAGLINE, getGrade, lessons } from '../../lib/content';
import { labsFor, LAB_PLACEMENTS } from '../labs/registry';
import { getWorksheet } from '../worksheet/registry';
import type { OgCard } from './render';

export const DEFAULT_OG = 'trang-chu';

export function ogCards(): Record<string, OgCard> {
  const cards: Record<string, OgCard> = {
    [DEFAULT_OG]: {
      kicker: 'Giáo dục trí tuệ nhân tạo · THPT',
      title: 'Học AI bằng cách chạm vào nó.',
      subtitle: '36 bài học, mô phỏng chạy ngay trên trình duyệt, phiếu học tập nộp bằng mã QR. Không cần tài khoản.',
      topicId: '11.4',
      grade: null,
    },
    'phong-thi-nghiem': {
      kicker: `Phòng thí nghiệm · ${Object.values(LAB_PLACEMENTS).flat().length} mô phỏng`,
      title: 'Đọc lí thuyết xong, thử ngay',
      subtitle: 'Mô hình 3D, webcam, mạng nơ-ron học trực tiếp. Không cài đặt, không gửi dữ liệu đi đâu.',
      topicId: '10.4',
    },
    'tu-dien': {
      kicker: 'Từ điển AI',
      title: 'Gặp từ lạ, tra ở đây',
      subtitle: 'Thuật ngữ trí tuệ nhân tạo của cả ba khối, tìm được cả khi gõ không dấu.',
      topicId: '11.3',
    },
  };

  for (const g of GRADES) {
    const data = getGrade(g);
    cards[`lop-${g}`] = {
      kicker: `Tuyến ${g} · ${data.topics.length} chuyên đề · 12 tiết`,
      title: `Lớp ${g}`,
      subtitle: GRADE_TAGLINE[g],
      topicId: data.topics[0]?.id ?? null,
      grade: g,
    };
  }

  for (const l of lessons) {
    const topic = getGrade(l.grade).topics.find((t) => t.id === l.topicId);
    const labs = labsFor(l.slug).length;
    cards[l.slug] = {
      kicker: `Lớp ${l.grade}${topic ? ` · Chuyên đề ${topic.id}` : ''} · Bài ${l.id}`,
      title: l.title,
      subtitle: topic?.lessonBlurbs[l.id] ?? topic?.title,
      topicId: l.topicId,
      grade: l.grade,
      tags: [labs ? `${labs} mô phỏng` : '', getWorksheet(l.slug) ? 'Phiếu học tập' : ''].filter(Boolean),
    };
  }
  return cards;
}
