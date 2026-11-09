import fs from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vite-plus';

import { PAGE_ENTRIES, SCRIPT_TARGETS } from './scripts/manifest.mjs';
import { componentsAlias, parcelSchemePlugin, sourceAlias } from './scripts/vite-plugins';

/**
 * Variables `src/**` reads via `process.env.*`. Parcel only inlined the ones a
 * module actually referenced; a `define` entry replaces every occurrence, so
 * this list is deliberately limited to the build-time configuration. Secrets
 * (e.g. ZERION_API_DEVELOPMENT_KEY) are never read by `src/**` and never
 * defined, which is what keeps them out of the bundle.
 */
const BUILD_ENV_VARS = [
  'BACKEND_ENV',
  'DEFI_SDK_TRANSACTIONS_API_URL',
  'FEATURE_LOYALTY_FLOW',
  'FEATURE_SOLANA',
  'GOOGLE_ANALYTICS_API_SECRET',
  'GOOGLE_ANALYTICS_MEASUREMENT_ID',
  'MIXPANEL_TOKEN_PUBLIC',
  'PROXY_URL',
  'TEST_WALLET_ADDRESS',
  'ZERION_API_URL',
  'ZERION_TESTNET_API_URL',
];

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'src');

const platform = process.env.PLATFORM === 'firefox' ? 'firefox' : 'chrome';
const target = process.env.BUILD_TARGET ?? 'pages';
const outDir = path.resolve(
  projectRoot,
  process.env.BUILD_OUT ?? (platform === 'firefox' ? 'dist-firefox' : 'dist'),
);
const isProduction = process.env.NODE_ENV !== 'development';

function buildEntries() {
  if (target === 'pages') {
    // Firefox has no side panel, so it ships two pages instead of three.
    const pages =
      platform === 'chrome'
        ? PAGE_ENTRIES
        : { popup: PAGE_ENTRIES.popup, ledger: PAGE_ENTRIES.ledger };
    return Object.fromEntries(
      Object.entries(pages).map(([name, file]) => [name, path.join(sourceRoot, file)]),
    );
  }
  const entry = SCRIPT_TARGETS[target];
  if (!entry) {
    throw new Error(
      `Unknown BUILD_TARGET "${target}". Expected one of: pages, ${Object.keys(SCRIPT_TARGETS).join(
        ', ',
      )}.`,
    );
  }
  return { [target]: path.join(sourceRoot, entry.input) };
}

/**
 * Leaves a sidecar listing emitted files, which `scripts/manifest.mjs` uses to
 * write the manifest and the `web_accessible_resources` entries for
 * content-script assets.
 */
function extensionBuildPlugin() {
  return {
    name: 'zerion-extension',
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
      const files = Object.keys(bundle).filter((file) => !file.endsWith('.map'));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, `.build-${target}.json`),
        JSON.stringify({ target, files }, null, 2),
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  // `vp test` runs in mode 'test': keep runtime `process.env` (see define below).
  // Tests resolve from the repository root; builds resolve from `src` so HTML
  // entries keep their `ui/...` paths.
  root: mode === 'test' ? projectRoot : sourceRoot,
  publicDir: false,
  plugins: [
    parcelSchemePlugin({ projectRoot }),
    extensionBuildPlugin(),
    react(),
    svgr(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: [sourceAlias(sourceRoot), componentsAlias(projectRoot)],
  },
  define:
    mode === 'test'
      ? // Tests run in Node with a real `process.env`; `vitest.setup.ts` fills
        // the required values at runtime. Inlining them here would bake empty
        // strings during transform.
        {}
      : {
          'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
          'process.env.PLATFORM': JSON.stringify(platform),
          ...Object.fromEntries(
            BUILD_ENV_VARS.map((name) => [
              `process.env.${name}`,
              JSON.stringify(process.env[name] ?? ''),
            ]),
          ),
        },
  lint: {
    plugins: ['oxc', 'typescript', 'react'],
    jsPlugins: [
      'eslint-plugin-security',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    categories: {
      correctness: 'warn',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: [
      'node_modules',
      'dist',
      'dist-firefox',
      'dist-e2e',
      'e2e-report',
      'playwright/.cache',
      '**/*.spec.ts',
      'e2e/**/*.ts',
    ],
    rules: {
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-case-declarations': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': 'error',
      'no-const-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-constant-condition': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-empty-static-block': 'error',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-import-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-obj-calls': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-this-before-super': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'no-unused-vars': 'error',
      'no-useless-backreference': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',
      'no-with': 'error',
      'require-yield': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-console': 'warn',
      'no-use-before-define': [
        'error',
        {
          classes: false,
        },
      ],
      'no-restricted-globals': [
        'error',
        'addEventListener',
        'blur',
        'close',
        'closed',
        'confirm',
        'defaultStatus',
        'defaultstatus',
        'event',
        'external',
        'find',
        'focus',
        'frameElement',
        'frames',
        'history',
        'innerHeight',
        'innerWidth',
        'length',
        'location',
        'locationbar',
        'menubar',
        'moveBy',
        'moveTo',
        'name',
        'onblur',
        'onerror',
        'onfocus',
        'onload',
        'onresize',
        'onunload',
        'open',
        'opener',
        'opera',
        'outerHeight',
        'outerWidth',
        'pageXOffset',
        'pageYOffset',
        'parent',
        'print',
        'removeEventListener',
        'resizeBy',
        'resizeTo',
        'screen',
        'screenLeft',
        'screenTop',
        'screenX',
        'screenY',
        'scroll',
        'scrollbars',
        'scrollBy',
        'scrollTo',
        'scrollX',
        'scrollY',
        'self',
        'status',
        'statusbar',
        'stop',
        'toolbar',
        'top',
        'origin',
      ],
      'no-array-constructor': 'error',
      'no-unused-expressions': 'error',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'warn',
      'security/detect-eval-with-expression': 'warn',
      'security/detect-new-buffer': 'warn',
      'security/detect-no-csrf-before-method-override': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-bidi-characters': 'warn',
      // Oxlint enables these type-aware rules by default; the previous ESLint
      // setup did not, and they flag pre-existing call sites.
      'typescript/no-floating-promises': 'off',
      'typescript/unbound-method': 'off',
      'typescript/await-thenable': 'off',
      'typescript/no-redundant-type-constituents': 'off',
      'typescript/restrict-template-expressions': 'off',
      'typescript/no-useless-default-assignment': 'off',
      'typescript/no-misused-spread': 'off',
      'typescript/require-array-sort-compare': 'off',
      'typescript/no-base-to-string': 'off',
      // React Compiler advisories: not part of the previous gate.
      'react/refs': 'off',
      'react/set-state-in-effect': 'off',
      'react/preserve-manual-memoization': 'off',
      'react/incompatible-library': 'off',
      'react/purity': 'off',
      'react/static-components': 'off',
      // `children` passed as a prop is used deliberately in URLBar.
      'react/no-children-prop': 'off',
      'react/immutability': 'off',
      'react/globals': 'off',
      'react/use-memo': 'off',
      // Unused locals are enforced by `tsc`/TSRS (noUnusedLocals).
      'eslint/no-unused-vars': 'off',
      // Stylistic; the previous ESLint setup did not report it.
      'typescript/no-duplicate-type-constituents': 'off',
      'react/rules-of-hooks': 'error',
      // The previous ESLint setup did not report these; the sources use
      // `@ts-ignore` deliberately around untyped third-party APIs.
      'typescript/ban-ts-comment': 'off',
      // `require` is used to load bundled resources (readmes, fixtures).
      'typescript/no-require-imports': 'off',
      'typescript/no-var-requires': 'off',
      'typescript/no-duplicate-enum-values': 'error',
      'typescript/no-empty-object-type': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-extra-non-null-assertion': 'error',
      'typescript/no-misused-new': 'error',
      'typescript/no-namespace': 'error',
      'typescript/no-non-null-asserted-optional-chain': 'error',
      'typescript/no-this-alias': 'error',
      'typescript/no-unnecessary-type-constraint': 'error',
      'typescript/no-unsafe-declaration-merging': 'error',
      'typescript/no-unsafe-function-type': 'error',
      'typescript/no-wrapper-object-types': 'error',
      'typescript/prefer-as-const': 'error',
      'typescript/prefer-namespace-keyword': 'error',
      'typescript/triple-slash-reference': 'error',
      'typescript/consistent-type-imports': 'error',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    overrides: [
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        rules: {
          'constructor-super': 'off',
          'getter-return': 'off',
          'no-class-assign': 'off',
          'no-const-assign': 'off',
          'no-dupe-class-members': 'off',
          'no-dupe-keys': 'off',
          'no-func-assign': 'off',
          'no-import-assign': 'off',
          'no-new-native-nonconstructor': 'off',
          'no-obj-calls': 'off',
          'no-redeclare': 'off',
          'no-setter-return': 'off',
          'no-this-before-super': 'off',
          'no-undef': 'off',
          'no-unreachable': 'off',
          'no-unsafe-negation': 'off',
          'no-var': 'error',
          'no-with': 'off',
          'prefer-const': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
        },
      },
      {
        files: ['**/*.cjs', 'scripts/**/*.js'],
        globals: {
          __dirname: 'readonly',
          __filename: 'readonly',
          Buffer: 'readonly',
          clearImmediate: 'readonly',
          clearInterval: 'readonly',
          clearTimeout: 'readonly',
          console: 'readonly',
          Intl: 'readonly',
          process: 'readonly',
          queueMicrotask: 'readonly',
          setImmediate: 'readonly',
          setInterval: 'readonly',
          setTimeout: 'readonly',
          TextDecoder: 'readonly',
          TextEncoder: 'readonly',
          URL: 'readonly',
          URLSearchParams: 'readonly',
        },
        env: {
          commonjs: true,
        },
      },
      {
        files: ['**/*.mjs'],
        globals: {
          __dirname: 'readonly',
          __filename: 'readonly',
          Buffer: 'readonly',
          clearImmediate: 'readonly',
          clearInterval: 'readonly',
          clearTimeout: 'readonly',
          console: 'readonly',
          Intl: 'readonly',
          process: 'readonly',
          queueMicrotask: 'readonly',
          setImmediate: 'readonly',
          setInterval: 'readonly',
          setTimeout: 'readonly',
          TextDecoder: 'readonly',
          TextEncoder: 'readonly',
          URL: 'readonly',
          URLSearchParams: 'readonly',
          fetch: 'readonly',
        },
        env: {
          commonjs: true,
        },
      },
      {
        files: ['scripts/**/*', 'vite.config.ts', 'src/ui-lab/vite.config.ts'],
        rules: {
          'no-console': 'off',
          'security/detect-non-literal-fs-filename': 'off',
          // The shard selector builds regexes from a data table.
          'security/detect-non-literal-regexp': 'off',
          'typescript/no-require-imports': 'off',
          'typescript/no-var-requires': 'off',
          'no-undef': 'off',
        },
        jsPlugins: ['eslint-plugin-security'],
      },
    ],
    options: {
      typeAware: true,
      // Type errors are reported by `npm run typecheck` (TSRS) only.
      typeCheck: false,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['vitest.setup.ts'],
    // `vmThreads` keeps per-file isolation but reuses one thread pool instead
    // of spawning a process per test file (which was ~75% of the run).
    pool: 'vmThreads',
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}', '__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', 'dist*/**', 'e2e/**'],
  },

  fmt: {
    // Oxc defaults, minus what this repo deliberately pins:
    // - `singleQuote` because Oxlint enforces single quotes,
    // - `ignorePatterns` for build output and generated files,
    // - a wider `printWidth` for the env config, as before.
    singleQuote: true,
    ignorePatterns: [
      'node_modules/',
      'dist/',
      'dist-firefox/',
      'dist-e2e/',
      'e2e-report/',
      'test-results/',
      'blob-report/',
      'playwright/.cache/',
      'src/manifest.json',
      'package-lock.json',
      'src/modules/networks/networks-fallback.json',
      'src/ui/pages/Login/login-animation-lottie.json',
    ],
    overrides: [
      {
        files: ['src/env/config.ts'],
        options: { printWidth: 120 },
      },
    ],
  },

  build: {
    outDir,
    emptyOutDir: target === 'pages',
    copyPublicDir: false,
    sourcemap: false,
    reportCompressedSize: false,
    minify: isProduction,
    // One stylesheet, like the Parcel build: splitting CSS per async chunk
    // changes the cascade order (a reset imported by a lazily-loaded component
    // can end up after the layout rules it is supposed to precede).
    cssCodeSplit: false,
    rollupOptions: {
      input: buildEntries(),
      output:
        target === 'pages'
          ? {}
          : {
              format: 'iife' as const,
              inlineDynamicImports: true,
              entryFileNames: SCRIPT_TARGETS[target].fileName,
              // The content script's stylesheet must have a stable name: the
              // manifest lists it under `content_scripts[].css`.
              assetFileNames: `${target}.[ext]`,
            },
    },
  },
  worker: {
    format: 'iife',
    // Workers are bundled by a separate pipeline: without the polyfills plugin
    // the mnemonic worker throws `process is not defined` at runtime.
    plugins: () => [nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
  },
}));
