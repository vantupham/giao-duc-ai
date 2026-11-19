/** Bỏ dấu tiếng Việt và viết thường, để tìm "trong so" vẫn ra "trọng số". */
export const foldVietnamese = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
