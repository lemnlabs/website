import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import remarkCallouts from './src/plugins/remark-callouts.mjs';
import remarkObsidianHighlight from './src/plugins/remark-obsidian-highlight.mjs';
import remarkObsidianEmbed from './src/plugins/remark-obsidian-embed.mjs';
import remarkObsidianWikiLink from './src/plugins/remark-obsidian-wikilink.mjs';
import remarkObsidianTags from './src/plugins/remark-obsidian-tags.mjs';

export default defineConfig({
  site: 'https://lemnlabs.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkCallouts,
        remarkObsidianHighlight,
        remarkObsidianEmbed,
        remarkObsidianWikiLink,
        remarkObsidianTags,
      ],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
