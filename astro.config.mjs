// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://vantupham.github.io',
  base: '/giao-duc-ai',
  trailingSlash: 'ignore',
  integrations: [react()],
  vite: {
    build: { chunkSizeWarningLimit: 1500 },
  },
});
