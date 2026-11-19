// Tình huống lấy từ Bài 10.4 (Khởi động, mục 4 "Sáu chuyện", Luyện tập Bài 1). Đều là tình huống giả định.

export type Zone = 'xanh' | 'vang' | 'do';
export type Layer = 'none' | 'truong' | 'ca-hai';
export type Nature = 'dung' | 'hanh-vi' | 'su-co';

export interface TrafficCase {
  id: string;
  source: string;
  text: string;
  zones: Zone[];
  layer: Layer;
  nature: Nature;
  why: string;
  better?: string;
}

export const ZONE_LABEL: Record<Zone, string> = { xanh: 'Xanh: được dùng', vang: 'Vàng: được nếu khai báo', do: 'Đỏ: không được' };
export const LAYER_LABEL: Record<Layer, string> = {
  none: 'Không vi phạm',
  truong: 'Vi phạm quy định nhà trường',
  'ca-hai': 'Vi phạm cả quy định nhà trường lẫn pháp luật',
};
export const NATURE_LABEL: Record<Nature, string> = { dung: 'Cách dùng đúng', 'hanh-vi': 'Hành vi cố ý', 'su-co': 'Sự cố (không cố ý)' };

export const CASES: TrafficCase[] = [
  { id: 'k1', source: 'Khởi động', text: 'Nhờ trợ lí AI giải thích lại một khái niệm em chưa hiểu.', zones: ['xanh'], layer: 'none', nature: 'dung', why: 'AI giúp em hiểu bài; em vẫn là người học.' },
  { id: 'k2', source: 'Khởi động', text: 'Nhờ AI viết cả bài văn rồi nộp cho cô.', zones: ['do'], layer: 'truong', nature: 'hanh-vi', why: 'AI làm thay: vi phạm trung thực học thuật.', better: 'Tự viết; có thể nhờ AI góp ý bản nháp và khai báo.' },
  { id: 'k3', source: 'Khởi động', text: 'Nhờ AI gợi ý dàn ý, sau đó tự viết bài.', zones: ['vang'], layer: 'none', nature: 'dung', why: 'Được dùng nếu khai báo và theo hướng dẫn của thầy cô cho nhiệm vụ này.' },
  { id: 'k4', source: 'Khởi động', text: 'Dùng AI ghép mặt bạn vào một tấm ảnh vui rồi đăng lên nhóm lớp.', zones: ['do'], layer: 'ca-hai', nature: 'hanh-vi', why: 'Hình ảnh của bạn là dữ liệu cá nhân; đây là nội dung giả mạo người thật.', better: 'Không tạo. Nếu đã đăng: gỡ ngay, xin lỗi bạn, báo thầy cô.' },
  { id: 'c1', source: 'Chuyện 1', text: 'An nhờ chatbot viết toàn bộ bài nghị luận, đổi vài từ rồi nộp, không nói gì với cô.', zones: ['do'], layer: 'truong', nature: 'hanh-vi', why: 'AI làm thay, không khai báo. Đổi vài từ không làm ý tưởng thành của An.', better: 'Tự lập dàn ý, tự viết, nhờ AI góp ý bản nháp và khai báo.' },
  { id: 'c2', source: 'Chuyện 2', text: 'Để “chọc vui”, Bình dùng ứng dụng AI ghép mặt Chi vào một tấm ảnh hài rồi gửi vào nhóm lớp.', zones: ['do'], layer: 'ca-hai', nature: 'hanh-vi', why: '“Trêu nhau thôi” không làm tấm ảnh biến mất khỏi nhóm chat. Đây là giả mạo người thật.', better: 'Không tạo. Nếu đã gửi: gỡ ngay, xin lỗi Chi, báo với cô.' },
  { id: 'c3', source: 'Chuyện 3', text: 'Lớp trưởng Dũng dán vào chatbot danh sách lớp có họ tên, số điện thoại phụ huynh và điểm giữa kì để nhờ chia nhóm.', zones: ['do'], layer: 'ca-hai', nature: 'su-co', why: 'Dũng có ý tốt nhưng đã đưa dữ liệu cá nhân của cả lớp ra ngoài.', better: 'Thay tên bằng mã số (HS01, HS02…), bỏ số điện thoại trước khi dùng.' },
  { id: 'c4', source: 'Chuyện 4', text: 'Giang nhờ trợ lí AI giải thích lại bài hàm số bằng ví dụ khác, tự làm bài tập, đối chiếu đáp án với sách, rồi ghi phiếu khai báo.', zones: ['xanh'], layer: 'none', nature: 'dung', why: 'Mẫu của việc dùng AI đúng: để hiểu bài, tự làm, có kiểm chứng, có khai báo.' },
  { id: 'c5', source: 'Chuyện 5', text: 'Hải nhận đoạn ghi âm “giọng thầy hiệu trưởng” báo nghỉ học và chuyển tiếp vào ba nhóm chat mà không kiểm tra.', zones: ['do'], layer: 'truong', nature: 'su-co', why: 'Hải không tạo ra ghi âm, nhưng đã góp phần lan truyền thông tin sai.', better: 'Kiểm tra trên kênh chính thức của trường trước khi chia sẻ; báo thầy cô.' },
  { id: 'c6', source: 'Chuyện 6', text: 'Trong giờ kiểm tra, Khoa lén dùng điện thoại chụp đề và hỏi chatbot.', zones: ['do'], layer: 'truong', nature: 'hanh-vi', why: 'Vi phạm quy chế kiểm tra. Không có cách nào “làm cho đúng” ngoài việc không làm.' },
  { id: 'l1', source: 'Luyện tập 1a', text: 'Nhờ AI tạo 10 câu hỏi trắc nghiệm từ vở ghi của mình để tự ôn.', zones: ['xanh'], layer: 'none', nature: 'dung', why: 'Để tự ôn, dùng vở ghi của chính mình.' },
  { id: 'l2', source: 'Luyện tập 1b', text: 'Nhờ AI dịch nguyên một bài viết tiếng Anh trên mạng rồi nộp như bài tự viết.', zones: ['do'], layer: 'truong', nature: 'hanh-vi', why: 'AI làm thay và bài gốc là của người khác.' },
  { id: 'l3', source: 'Luyện tập 1c', text: 'Nhờ AI chỉ ra lỗi ngữ pháp trong đoạn văn tiếng Anh em tự viết, rồi em tự sửa.', zones: ['xanh', 'vang'], layer: 'none', nature: 'dung', why: 'Xanh hoặc vàng tùy yêu cầu của thầy cô: em tự viết, tự sửa; nên khai báo.' },
  { id: 'l4', source: 'Luyện tập 1d', text: 'Tải ảnh chụp cả lớp lên một ứng dụng lạ để “biến thành hoạt hình”.', zones: ['do'], layer: 'ca-hai', nature: 'su-co', why: 'Hình ảnh của các bạn là dữ liệu cá nhân; ứng dụng chưa được kiểm tra.' },
];
