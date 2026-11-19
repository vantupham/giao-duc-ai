// Danh sách mô phỏng và nơi chèn vào từng bài học.

export type LabKey = 'traffic-light' | 'recycling-station' | 'image-trainer' | 'neuron' | 'network-playground';

export interface LabPlacement {
  key: LabKey;
  title: string;
  description: string;
  /** Chèn sau mục có id bắt đầu bằng chuỗi này (id sinh từ tiêu đề mục). */
  afterSection: string;
}

export const LAB_PLACEMENTS: Record<string, LabPlacement[]> = {
  'bai-10-04': [
    {
      key: 'traffic-light',
      title: 'Mô phỏng: Đèn giao thông dùng AI',
      description: 'Xếp 14 tình huống vào vùng xanh, vàng, đỏ. Mỗi lần chọn, em nhận phân tích theo hai tầng quy định.',
      afterSection: '2-ba-vung',
    },
  ],
  'bai-10-11': [
    {
      key: 'recycling-station',
      title: 'Mô hình 3D: Mổ xẻ trạm phân loại rác',
      description: 'Xoay trạm, bấm vào từng bộ phận để gọi tên năm thành phần. Bật “mục tiêu mới” để xem thành phần nào phải đổi.',
      afterSection: '3-nam-thanh-phan',
    },
    {
      key: 'image-trainer',
      title: 'Phòng huấn luyện: Tự dạy máy phân loại rác',
      description: 'Chụp ảnh đồ vật bằng webcam, huấn luyện ngay trên trình duyệt và chỉ ra năm thành phần trên màn hình. Ảnh không rời khỏi máy em.',
      afterSection: 'trai-nghiem',
    },
  ],
  'bai-11-10': [
    {
      key: 'neuron',
      title: 'Mô phỏng: Nơ-ron giấy của Bình',
      description: 'Bật tắt tín hiệu, kéo trọng số và ngưỡng. Tự tay “huấn luyện” nơ-ron cho khớp thói quen của Bình và Chi.',
      afterSection: '1-mot-no-ron',
    },
    {
      key: 'network-playground',
      title: 'Phòng thí nghiệm: Nhìn một mạng nơ-ron đang học',
      description: 'Chọn dữ liệu, thêm bớt lớp ẩn và nơ-ron, bấm Huấn luyện. Xem đường phân chia hình thành và mạng 3D đổi trọng số theo thời gian thực.',
      afterSection: 'trai-nghiem',
    },
  ],
};

export const labsFor = (slug: string): LabPlacement[] => LAB_PLACEMENTS[slug] ?? [];

export const PILOT_SLUGS = Object.keys(LAB_PLACEMENTS);
