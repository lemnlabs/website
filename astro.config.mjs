import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import remarkCallouts from './src/plugins/remark-callouts.mjs';

export default defineConfig({
  site: 'https://lemnlabs.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  markdown: {
    processor: unified({ remarkPlugins: [remarkCallouts] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
