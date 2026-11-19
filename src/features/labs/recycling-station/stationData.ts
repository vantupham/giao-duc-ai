// Nội dung lấy từ Bài 10.11 (mục 3, 4, 6). Trạm phân loại rác là tình huống giả định của tài liệu.

export type PartKey = 'data' | 'algorithm' | 'model' | 'output' | 'feedback';

export interface PartInfo {
  key: PartKey;
  name: string;
  color: string;
  definition: string;
  atStation: string;
  lan: string;
  human: string;
  /** Khi mục tiêu đổi (thêm nhóm nguy hại). */
  change: { must: boolean; how: string };
}

export const PARTS: PartInfo[] = [
  {
    key: 'data',
    name: 'Dữ liệu',
    color: '#2f6fdb',
    definition: 'Các ví dụ được dùng để dạy máy và để kiểm tra xem máy học đã tốt chưa.',
    atStation: 'Hàng nghìn ảnh vỏ chai, hộp sữa, vỏ trái cây, hộp xốp… chụp tại căn tin, mỗi ảnh được con người gán nhãn.',
    lan: 'Đề thi các năm kèm đáp án.',
    human: 'Con người thu thập và gán nhãn dữ liệu.',
    change: { must: true, how: 'Phải chụp và gán nhãn thêm ảnh pin, bóng đèn hỏng…' },
  },
  {
    key: 'algorithm',
    name: 'Thuật toán',
    color: '#8a4fd0',
    definition: 'Cách máy học từ các ví dụ: đoán, so với nhãn đúng, tự điều chỉnh, lặp lại hàng vạn lần.',
    atStation: 'Xem một ảnh, đoán nhóm, so với nhãn do con người gán, sai thì chỉnh một chút.',
    lan: 'Cách ôn: mỗi tối làm một đề, sai đâu xem lại đó.',
    human: 'Con người chọn thuật toán và quyết định khi nào mô hình đủ tốt để đem dùng.',
    change: { must: false, how: 'Có thể giữ nguyên: cách học vẫn như cũ.' },
  },
  {
    key: 'model',
    name: 'Mô hình',
    color: '#158a7a',
    definition: 'Kết quả của việc học. Mỗi khi có đầu vào mới, mô hình tính toán và tạo ra đầu ra.',
    atStation: '“Bộ nhận biết” đặt trong trạm. Chính nó chạy mỗi lần Minh đưa vỏ hộp sữa lên.',
    lan: 'Hiểu biết, kĩ năng trong đầu Lan sau ba tuần ôn.',
    human: 'Con người quyết định có đưa mô hình vào dùng hay không.',
    change: { must: true, how: 'Phải huấn luyện lại; mô hình cũ chưa từng “thấy” pin.' },
  },
  {
    key: 'output',
    name: 'Đầu ra',
    color: '#e07a2f',
    definition: 'Kết quả hệ thống trả cho người dùng: một phỏng đoán có căn cứ, không phải chân lí.',
    atStation: 'Dòng chữ trên màn hình: “Tái chế. Mức chắc chắn: 92%”.',
    lan: 'Bài làm với đề hoàn toàn mới.',
    human: 'Con người đọc đầu ra và quyết định có làm theo hay không.',
    change: { must: true, how: 'Thêm nhãn “nguy hại” và hướng dẫn mang đến điểm thu gom riêng.' },
  },
  {
    key: 'feedback',
    name: 'Phản hồi',
    color: '#c0392b',
    definition: 'Thông tin cho biết đầu ra đúng hay sai, được đưa trở lại để cải thiện hệ thống.',
    atStation: 'Nút “Sai rồi”. Cuối tuần, người phụ trách gán lại nhãn đúng cho ảnh bị báo sai và cho máy học thêm.',
    lan: 'Cô chấm và chữa bài.',
    human: 'Con người phản hồi và xử lí phản hồi.',
    change: { must: true, how: 'Theo dõi riêng các lần nhận sai ở nhóm mới, vì sai ở nhóm này gây hại nhiều hơn.' },
  },
];

export type Bin = 'tai-che' | 'huu-co' | 'con-lai' | 'nguy-hai';

export const BIN_LABEL: Record<Bin, string> = { 'tai-che': 'Tái chế', 'huu-co': 'Hữu cơ', 'con-lai': 'Còn lại', 'nguy-hai': 'Nguy hại' };

export interface TrashItem {
  id: string;
  name: string;
  icon: string;
  truth: Bin;
  /** Dự đoán của mô hình cũ (3 nhóm) và mô hình mới (4 nhóm). */
  oldModel: { bin: Bin; confidence: number };
  newModel: { bin: Bin; confidence: number };
}

export const ITEMS: TrashItem[] = [
  { id: 'sua', name: 'Vỏ hộp sữa', icon: '🥛', truth: 'tai-che', oldModel: { bin: 'tai-che', confidence: 92 }, newModel: { bin: 'tai-che', confidence: 91 } },
  { id: 'chuoi', name: 'Vỏ chuối', icon: '🍌', truth: 'huu-co', oldModel: { bin: 'huu-co', confidence: 97 }, newModel: { bin: 'huu-co', confidence: 97 } },
  { id: 'xop', name: 'Hộp xốp dính thức ăn', icon: '🍱', truth: 'con-lai', oldModel: { bin: 'tai-che', confidence: 58 }, newModel: { bin: 'con-lai', confidence: 81 } },
  { id: 'lon', name: 'Lon nước ngọt', icon: '🥫', truth: 'tai-che', oldModel: { bin: 'tai-che', confidence: 95 }, newModel: { bin: 'tai-che', confidence: 95 } },
  { id: 'pin', name: 'Viên pin cũ', icon: '🔋', truth: 'nguy-hai', oldModel: { bin: 'tai-che', confidence: 61 }, newModel: { bin: 'nguy-hai', confidence: 88 } },
];
