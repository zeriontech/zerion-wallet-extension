# Build and check toolchain

The extension is built and checked with **Vite+** (Vite on Rolldown, Oxlint, Oxfmt, Vitest) and type-checked with **TSRS**, matching `zerion-web-app`. Everything is configured in `vite.config.ts`; CI calls the same npm scripts as a developer does.

## Commands

| Task              | Command                                          | Tool                                                                                           |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Dev build (watch) | `npm start`                                      | `vp build` on every change (~2 s)                                                              |
| Async build       | `npm run build:chrome` / `npm run build:firefox` | `vp build`, 4 targets per platform                                                             |
| E2E build         | `npm run build:e2e`                              | same builder, `dist-e2e`, secrets scanned                                                      |
| Beta build        | `npm run build:beta -- --platform=chrome`        | same builder, `--brand=beta`: coral icons, beta Firefox id, `<version>.<run>` manifest version |
| Unit tests        | `npm run test:unit`                              | `vp test run` (Vitest, `vmThreads`)                                                            |
| Lint              | `npm run lint:check`                             | `vp lint --deny-warnings` (Oxlint)                                                             |
| Format            | `npm run format:check`                           | `vp fmt --check` (Oxfmt)                                                                       |
| Types             | `npm run typecheck`                              | `tsrs -p . --noEmit`                                                                           |
| UI kit playground | `npm run ui-lab`                                 | `vp dev` with `src/ui-lab/vite.config.ts`                                                      |

`typecheck:watch` still uses `tsc --watch`; the gate itself is TSRS. TSRS is a checker only — it cannot emit the bundles, so `vp build` stays in charge of the output.

## Why four builds per platform

An MV3 extension needs bundles with different constraints, which one Rollup graph cannot express:

| Target           | Output                                                                 | Constraint                                                                       |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `pages`          | `ui/popup.html`, `ui/sidepanel.html`, `ui/hardware-wallet/ledger.html` | HTML entries, code splitting, one CSS file                                       |
| `background`     | `background.js`                                                        | single IIFE (Firefox MV3 has no module service worker)                           |
| `content-script` | `content-script.js` + `content-script.css`                             | single IIFE, classic script; its stylesheet is listed in `content_scripts[].css` |
| `in-page`        | `in-page.js`                                                           | single IIFE, injected into the page's own world                                  |

`scripts/build.mjs` runs them in sequence into one output directory and then writes the manifest from `src/manifest-<platform>.json`:

- `background` becomes `{ service_worker: "background.js" }` (Chrome) or `{ scripts: ["background.js"] }` (Firefox);
- `content_scripts[0].js` and `web_accessible_resources[0].resources` point at the emitted bundles;
- any asset the content script emits is added to `web_accessible_resources`, because pages can only load declared resources.

`scripts/manifest.mjs` holds that logic: it exports the source-to-output tables (`PAGE_ENTRIES`, `SCRIPT_TARGETS`), which `vite.config.ts` imports, so the mapping exists in one place.

## Parcel conventions kept in the sources

`src/**` still contains ~470 Parcel-specific imports. Rewriting them would add review noise to an already large migration, so `scripts/vite-plugins.ts` teaches Vite the same conventions:

| Specifier                      | Meaning                     | Vite equivalent                 |
| ------------------------------ | --------------------------- | ------------------------------- |
| `jsx:src/ui/assets/x.svg`      | React component             | `?react` via `vite-plugin-svgr` |
| `url:src/ui/assets/x.png`      | asset URL                   | plain asset import              |
| `data-url:src/ui/assets/x.svg` | inlined data URI            | `?inline`                       |
| `url:./x.worker`               | TS worker without extension | `?worker&url`                   |

Remaining Parcel-specific adjustments, all deliberate:

- `@zeriontech/components` only exports its root (which has no typings), so the two deep ui-kit imports are mapped explicitly in `vite.config.ts` and `tsconfig.json`.
- Two CSS files used `url('~src/...')`; the `~` prefix is Parcel-only and was replaced with relative paths.
- `@zeriontech/components/lib/style.css` needed a `*.css` ambient declaration (TS 7 resolves CSS imports, the old `node10` resolution did not).
- `PageTop.tsx` uses `jsx:` imports for SVGs, so `@vitejs/plugin-react` runs with the automatic JSX runtime; the ~250 files that imported `React` only for JSX lost that unused import.

## Formatting

The `fmt` block in `vite.config.ts` reproduces the previous Prettier 2 configuration - 80 columns, single quotes, `trailingComma: es5`, `arrowParens: always`, the same markdown override - with import sorting and `package.json` sorting off, so the switch reflowed 120 files instead of ~730. What remains is not configurable: Oxfmt applies Prettier 3's nested-ternary indentation and wraps multi-value CSS declarations differently.

Oxlint does not implement `import/order`; Oxc's answer is Oxfmt's import sorting, which is off here. Import order is therefore not gated.

## Things that behave differently from the Parcel build

- **Output layout.** Pages stay at their source-relative paths (`ui/popup.html`), bundles at the output root, assets under `assets/`. The manifest is the source of truth for URLs at runtime, and `LedgerIframe` now requests `/ui/hardware-wallet/ledger.html` (root-absolute) instead of the relative `ui/hardware-wallet/ledger.html`, which resolved against the popup path.
- **CSS.** One stylesheet per platform (`cssCodeSplit: false`) instead of one per entry point: splitting changes the cascade order between a reset imported by a lazily rendered component and the layout rules it must not override. In the popup's own viewport (425 px) the rendering is identical to the Parcel build; in a full-width tab the body is now centered rather than left-aligned, which is what the theme's `margin-inline: auto` asks for.
- **Node globals.** `vite-plugin-node-polyfills` injects its `process`/`Buffer` shims into the modules it transforms, but not into every worker or async chunk; `readable-stream` reads `process.browser` at module scope, which made the mnemonic worker throw `process is not defined`. Every entry point imports `src/shared/polyfills.ts` first, which installs the same shims on `globalThis` before any dependency is evaluated.
- **Dynamic JSON imports** return a module namespace. `lottie-web` mutates the animation data it is given, so `LayersAnimationLottie` unwraps `default`.

## Supply chain

`.npmrc` keeps `min-release-age=15` and adds `legacy-peer-deps=true`: the `vite` override points every Vite import at `vite-plus-core` (versioned `1.4.x`), while plugins still declare peer ranges against upstream Vite, so peer resolution cannot succeed by construction. Keep `overrides.vite` in `package.json` in sync with the `vite-plus` version. Versions pinned here are the newest inside the cooldown window: `vite-plus@1.4.0`, `vitest@5.0.5`, `tsrs@0.18.0-ts7.1.0-dev`.

## Measured on this workstation (macOS arm64, warm caches)

| Step                                  | Before (Parcel / Jest / tsc)        | After    | Change |
| ------------------------------------- | ----------------------------------- | -------- | ------ |
| Chrome build                          | 14.0 s                              | 1.6 s    | −89 %  |
| `build:production` (Chrome + Firefox) | 25.2 s                              | 4.3 s    | −83 %  |
| Unit tests (57 files / 478 tests)     | 21.8 s                              | 9.2 s    | −58 %  |
| Type check                            | 14.8 s                              | 0.36 s   | TSRS   |
| Lint                                  | (ESLint, not measured on this tree) | 2.0 s    | Oxlint |
| Format check                          | 5.4 s (Prettier)                    | 0.3 s    | Oxfmt  |
| Output (JS total)                     | 25.3 MiB                            | 12.8 MiB | −49 %  |

Runner speed varies, so treat CI numbers as the signal and these as a direction. The output-size drop comes from Rolldown's chunking; the manifest, `_locales` and icon files are byte-identical in layout to the Parcel build.
