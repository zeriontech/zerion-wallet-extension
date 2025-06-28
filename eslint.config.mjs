// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginSecurity from 'eslint-plugin-security';
import confusingBrowserGlobals from 'confusing-browser-globals';
import importPlugin from 'eslint-plugin-import';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['node_modules', 'dist'] },
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

  reactHooks.configs['recommended-latest'],

  importPlugin.flatConfigs.recommended,
  // tanstackQuery.configs.
  {
    plugins: { '@tanstack/query': tanstackQuery },
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/prefer-query-object-syntax': 'error',
    },
  }
);
