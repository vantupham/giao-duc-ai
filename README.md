# Giáo dục AI – website học và dạy trí tuệ nhân tạo (THPT)

Website tĩnh cho chuyên đề Giáo dục trí tuệ nhân tạo lớp 10–12 của Tổ Tin học, Trường THPT Hùng Vương (tài liệu lưu hành nội bộ).

- **36 bài học** chuyển tự động từ tài liệu học tập (.docx) và slide (.pptx).
- **Mô phỏng chạy trên trình duyệt**: đèn giao thông dùng AI (10.4), trạm phân loại rác 3D và phòng huấn luyện webcam (10.11), nơ-ron giấy và mạng nơ-ron 3D (11.10).
- **Phiếu học tập cuối bài** chấm theo mục tiêu; học sinh nộp bằng **mã QR**, giáo viên quét ở trang *Tổng hợp phiếu*.
- **Chế độ giáo viên**: tiến trình 45 phút, slide, phiếu ra cửa.
- Không tài khoản, không máy chủ, không thu thập dữ liệu. Mọi thứ lưu trong trình duyệt của người dùng.

Địa chỉ: https://vantupham.github.io/giao-duc-ai/

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev        # mở http://localhost:4321/giao-duc-ai/
npm test           # kiểm thử
npm run build      # xuất website tĩnh vào dist/
```

## Cập nhật nội dung bài học

Nội dung bài nằm trong `src/content/generated/`, do bộ chuyển đổi sinh ra từ tài liệu gốc. Khi tài liệu .docx hoặc slide .pptx thay đổi:

1. Đặt thư mục `Tai_lieu_hoc_tap/` và `Slide_bai_giang/` cạnh thư mục dự án (cấu trúc như hiện tại).
2. Chạy `npm run convert` (hoặc `node scripts/convert-docx.mjs <đường-dẫn-thư-mục-chứa-tài-liệu>`).
3. Kiểm tra bằng `npm run dev`, rồi commit các tệp thay đổi trong `src/content/generated/`, `public/media/`, `public/slides/`.

Bộ chuyển đổi nhận diện các mục theo kiểu đoạn văn của tài liệu: `Heading1` là bài, `Heading2/3` là mục, khối `BlockText` có nhãn **Khái niệm / Dễ nhầm / Câu chuyện có thật / Em có biết? / Hoạt động N** thành hộp tương ứng. Trích dẫn `[n]` tự liên kết tới trang Nguồn tham khảo.

## Thêm phiếu học tập cho một bài

Tạo tệp `src/content/worksheets/bai-XX-YY.json` theo mẫu `bai-11-10.json`:

- `objectives`: đúng số mục tiêu của bài (M1, M2…).
- `summary.lines`: câu có chỗ trống `[[đáp án]]`; `distractors`: từ nhiễu.
- `questions`: loại `single`, `truefalse`, `order` (liệt kê đúng thứ tự), `classify`. Mỗi câu gắn `objective` và `level` (`nhan-biet` / `thong-hieu` / `van-dung`). Ghi `misconception` cho phương án sai, lấy từ hộp *Dễ nhầm*.
- `apply`: tình huống vận dụng mới + tiêu chí 3 mức.

Chạy `npm test`: bộ kiểm thử tự kiểm tra phiếu đúng quy tắc biên soạn (mỗi mục tiêu có câu hỏi, có câu Vận dụng, mỗi câu một đáp án đúng…) và mã QR không quá dài. **Khi sửa nội dung một phiếu đã dùng, tăng `version`** để trang tổng hợp không lẫn kết quả cũ.

## Thêm mô phỏng vào bài

Khai báo trong `src/features/labs/registry.ts` (bài nào, chèn sau mục nào) và thêm thành phần vào `src/features/labs/LabSlot.astro`.

## Cấu trúc

```
scripts/                 bộ chuyển đổi .docx/.pptx → JSON
src/content/generated/   nội dung bài (sinh tự động)
src/content/worksheets/  phiếu học tập (soạn tay)
src/features/worksheet/  phiếu: chấm theo mục tiêu, mã hóa QR (Base45 + nén)
src/features/teacher/    trang tổng hợp phiếu cho giáo viên
src/features/labs/       các mô phỏng
src/pages/               các trang
public/models/           mô hình MobileNet (Apache 2.0) cho phòng huấn luyện
```

## Triển khai

Website được phục vụ từ nhánh `gh-pages`. Hiện tại đăng thủ công:

```bash
bash scripts/deploy-gh-pages.sh   # kiểm thử, build, đẩy dist/ lên gh-pages
```

Có sẵn quy trình tự động `.github/workflows/deploy.yml` (kiểm thử + build + đăng mỗi lần đẩy lên `main`). Để dùng: cấp quyền `workflow` cho GitHub CLI (`gh auth refresh -h github.com -s workflow`), commit tệp này, rồi trong *Settings → Pages* đổi *Source* sang **GitHub Actions**.
