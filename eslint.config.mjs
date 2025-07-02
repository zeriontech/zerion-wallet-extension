// @ts-check
import js from '@eslint/js';
import * as tanstackQuery from '@tanstack/eslint-plugin-query';
import confusingBrowserGlobals from 'confusing-browser-globals';
import * as reactHooks from 'eslint-plugin-react-hooks';
import pluginSecurity from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import previewsPlugin from './src/ui-lab/previews/eslint-rules/previews-plugin.mjs';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'e2e-report', 'playwright/.cache'] },
  // Base JS rules for all files
  {
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'warn',
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-use-before-define': ['error', { classes: false }],
      'no-restricted-globals': ['error', ...confusingBrowserGlobals, 'origin'],
    },
  },
  {
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-var-requires': 'off', // for requiring resources
      '@typescript-eslint/no-require-imports': 'off', // for requiring resources
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // handled by TS noUnusedLocals
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-unused-vars': 'off', // handled by TypeScript
      'react/prop-types': 'off', // Use TypeScript instead
    },
  },

  // Security plugin
  {
    ...pluginSecurity.configs.recommended,
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off', // too many false positives
    },
  },

  // React Hooks
  {
    extends: [reactHooks.configs['recommended-latest']],
    ignores: ['**/*.spec.ts', 'e2e/**/*.ts'],
  },

  {
    plugins: { '@tanstack/query': tanstackQuery },
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-deprecated-options': 'error',
      '@tanstack/query/prefer-query-object-syntax': 'error',
      '@tanstack/query/stable-query-client': 'error',
    },
  },

  // Import Sorting
  {
    plugins: { import: importPlugin },
    rules: { 'import/order': 'error' },
  },

  // Custom
  {
    plugins: { previews: previewsPlugin },
    rules: { 'previews/no-preview': 'warn' },
  },

  {
    files: ['**/*.cjs', 'scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  }
);
