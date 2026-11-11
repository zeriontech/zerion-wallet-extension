# Dependency reduction audit — clean Vite+ main (2026-11-10)

## Goal

Reduce the dependency surface without an upgrade campaign. Keep ethers,
Solana web3, React, react-query, and the other large/core libraries as they are;
replace tiny or low-usage packages with ModernDash, native APIs, or small local
modules; and remove unused direct dependencies.

Baseline: `origin/main` at `e58b0d3d` (Vite+/Vitest/Oxlint/Oxfmt).

## Final metrics

| Metric                             |   clean main |        final |
| ---------------------------------- | -----------: | -----------: |
| Direct dependencies                |           63 |           45 |
| Dev dependencies                   |           27 |           22 |
| `npm ls --all --parseable` entries |          741 |          703 |
| Lockfile package entries           |          814 |          776 |
| `package-lock.json` size           |    395,921 B |    383,543 B |
| `node_modules` on disk             |      421 MiB |      418 MiB |
| `npm audit` total                  |           41 |           22 |
| `npm audit` high / critical        |       20 / 0 |        0 / 0 |
| Chrome dist JS                     | 13,409,323 B | 13,254,108 B |
| Background entry                   |  2,526,284 B |  2,464,629 B |
| In-page entry                      |    261,261 B |    274,331 B |

The in-page entry grows ~13 KB because the local SPL instruction builder and
its buffer conversion replace `@solana/spl-token`; the total bundle still falls.
`node_modules` is roughly flat: ModernDash and its type-only tree replace lodash,
while the removed tiny packages were small on disk.

## What was replaced

| Removed package                                                                                                      | Replacement                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `lodash` (memoize, debounce, omit, set, merge, groupBy, sortBy, noop)                                                | `moderndash` for the supported functions; native code for noop; a local trailing-capable `throttle` |
| `capitalize-ts`                                                                                                      | local `capitalize` (ModernDash's version lowercases the tail, so it was not a drop-in)              |
| `is-truthy-ts`                                                                                                       | local `isTruthy` (`value != null`)                                                                  |
| `normalized-contains`                                                                                                | local `normalizedContains` with identical case-sensitive diacritic handling                         |
| `get-error`                                                                                                          | vendored 100-line `getErrorBase` (MIT) with the same branch order                                   |
| `store-unit` / `@store-unit/react`                                                                                   | local `Store`, `FormDataStore`, `useStore`, `useSelectorStore`                                      |
| `react-area`                                                                                                         | local `AreaProvider` / `RenderArea` / `Content`                                                     |
| `@download/blockies`                                                                                                 | local blockies renderer with golden-output tests                                                    |
| `normalize.css`                                                                                                      | vendored 8.0.1 stylesheet (MIT)                                                                     |
| `memoize-one`                                                                                                        | local `memoizeOne` wrapper on ModernDash `memoize` (last-call `===` cache)                          |
| `@solana/spl-token`                                                                                                  | local SPL transfer/ATA/mint-decimals builders with instruction tests                                |
| `rlp`                                                                                                                | `ethers.encodeRlp`, with odd-length hex normalization; parity-tested then test removed              |
| `dayjs`                                                                                                              | local `src/shared/date` covering the used subset; parity-tested then test removed                   |
| Unused: `@ethersproject/abstract-provider`, `bip32`, `@noble/ed25519`, `stream-browserify`, `buffer`                 | removed                                                                                             |
| Unused dev: `@tanstack/eslint-plugin-query`, `@types/lodash`, `@types/socket.io-client`, `confusing-browser-globals` | removed                                                                                             |

Security-only updates: `nanoid` 6, `uuid` 11 (with a nested `uuid@8` override
for `rpc-websockets` CJS), `react-router-dom` 6.30.6 (patched `@remix-run/router`),
and `@playwright/test` 1.64 with the devtools launch option moved to a Chromium flag.

## Deliberately kept

- **ethers v6 + the v5 `@ethersproject/*` helpers** — migration is a larger,
  separate effort.
- **`@solana/web3.js` 1.99** — same; replacing `@solana/spl-token` was isolated
  to one call site and did not require a web3 upgrade.
- **React 18 / react-query 4 / React Virtual / motion / downshift / ky** — no
  upgrade campaign; only security patches where behavior was unchanged.
- **classnames** is kept (widely used, actively maintained); `memoize-one`
  was removed because a last-call wrapper on ModernDash `memoize` is trivial.
- **nanoevents, nanoid, uuid, tweetnacl** — widely used and maintained;
  `tweetnacl` has one signing call site but replacing it would touch crypto
  code for little dependency gain.

## Remaining audit findings

`npm audit` is **22 total: 15 low, 7 moderate, 0 high, 0 critical** (from 41,
including 20 high). Remaining items are:

- `elliptic` via the ethers v5 compatibility stack and the Vite Node polyfill;
  no fixed version without a breaking ethers/polyfill change.
- `uuid` below 11 through `jayson`/`rpc-websockets` nested under web3 v1; the
  root `uuid` is 11.1.1, and a `rpc-websockets → uuid@8` override keeps its CJS
  require working.
- `react-router` 6.30.6 still falls inside the advisory range; v7 fixed it but
  changed navigation/Suspense timing enough to break the onboarding-backup e2e
  flow, so the patched v6 line is retained.
- `stream-json` in a dev/build toolchain path.

No high or critical findings remain.

## Verification

- Clean `npm ci`
- `npm run lint:check`, `npm run format:check`, `npm run typecheck`
- `npm run test:unit` — 63 suites / 489 tests
- `npm run build:production` — Chrome and Firefox
- `npx playwright test` locally — 22/22 e2e tests pass.
- New tests: memoize-one semantics, normalized contains, capitalize, form-data
  path setting, SPL instructions, blockies output.
