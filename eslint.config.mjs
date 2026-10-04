import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default defineConfig(
  { ignores: ['node_modules/**', 'dist/**', '.astro/**', '.husky/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}', '**/*.astro'],
    extends: [tseslint.configs.recommended],
  },
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx,astro}', 'public/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.{js,mjs,cjs}', 'scripts/**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  prettier,
);
