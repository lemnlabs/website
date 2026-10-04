export default {
  '*.{js,mjs,cjs,jsx,ts,tsx,astro}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  '*.{css,json,jsonc,md,mdx,yaml,yml,html,svg}': 'prettier --write',
};
