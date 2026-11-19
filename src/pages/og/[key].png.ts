// Ảnh xem trước khi chia sẻ link, tạo sẵn lúc build: /og/<key>.png
import type { APIRoute, GetStaticPaths } from 'astro';
import { ogCards } from '../../features/og/cards';
import { renderOg, type OgCard } from '../../features/og/render';

export const getStaticPaths: GetStaticPaths = () => Object.entries(ogCards()).map(([key, card]) => ({ params: { key }, props: { card } }));

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { card: OgCard }).card);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
