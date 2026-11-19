// Chỉ mục tìm kiếm toàn site, tạo sẵn lúc build; trình duyệt chỉ tải khi em mở hộp tìm kiếm.
import type { APIRoute } from 'astro';
import { buildSearchDocs } from '../features/search/buildIndex';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchDocs()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
