# Dependency audit — rebased on Vite+ main (2026-11-10)

## Scope and method

The branch was rebased onto `origin/main` at `504b10ba`, which replaced Parcel,
Jest, ESLint, and Prettier with Vite+/Rolldown, Vitest, Oxlint, and Oxfmt. The
dependency work was replayed onto that toolchain rather than reintroducing the
old one.

Inventory from imports/requires/dynamic imports/CSS, `npm ls --all`,
`npm outdated`, `npm audit`, and direct-use scans. Every change below was
followed by typecheck, lint, format, unit tests, and both production builds.

## Rebase resolution

Main's Oxfmt pass touched the same files as this branch's Prettier pass. The
branch was first reformatted with main's Oxfmt, reducing the merge from 527 to
105 conflicts. Resolutions kept main's Vite+/Vitest/Oxlint infrastructure and
this branch's runtime migrations; Parcel/Jest/ESLint/Prettier configs and
dependencies were not restored.

## Final metrics vs latest main

| Metric                             | `origin/main` |        Final |         Δ |
| ---------------------------------- | ------------: | -----------: | --------: |
| Direct dependencies                |            63 |           46 |       −17 |
| Dev dependencies                   |            27 |           24 |        −3 |
| `npm ls --all --parseable` entries |           741 |          725 |       −16 |
| Lockfile package entries           |           814 |          798 |       −16 |
| `package-lock.json` size           |     395,921 B |    419,524 B | +23,603 B |
| `node_modules` on disk             |       421 MiB |      558 MiB |  +137 MiB |
| `npm audit` total                  |            41 |            6 |       −35 |
| `npm audit` high / critical        |        20 / 0 |        0 / 0 |       −20 |
| Chrome dist JS                     |  13,409,323 B | 10,303,685 B |    −23.2% |
| Background entry                   |   2,526,284 B |  1,480,764 B |    −41.4% |
| In-page entry                      |     261,261 B |    164,415 B |    −37.1% |

`node_modules` grew because `@solana/web3.js` 3 brings `@solana/kit`, while the
removed Parcel/Jest/ESLint trees were smaller than that addition. The compiled
bundle still fell 23% because web3 v1, ethers v5, `@solana/spl-token`, `rlp`,
and several small packages left the graph.

## Migrations executed

| Area                 | Change                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unused/dead packages | Removed `@ethersproject/abstract-provider`, `bip32`, `bip39` v2-era helpers, `rlp`, `@download/blockies`, `get-error`, `react-area`, `store-unit`/`@store-unit/react`, `capitalize-ts`, `is-truthy-ts`, `normalized-contains`, `normalize.css` |
| Cryptography         | `tweetnacl` → `@noble/ed25519`; `ed25519-hd-key` 2 removes `create-hmac`/`cipher-base`/`sha.js`; Solana signing vectors pass                                                                                                                   |
| Ethereum             | ethers v5 compatibility stack removed; HD wallet, mnemonic validation, hex serialization, and persisted transaction shapes migrated to ethers v6 with parity tests                                                                             |
| Solana               | `@solana/web3.js` 3.0.1; async Keypair/signing/wallet restoration; `@solana/spl-token` removed in favor of local SPL instruction builders with encoding tests                                                                                  |
| React                | React/React DOM 19.3, ref-as-prop, JSX compat declaration for old third-party declarations                                                                                                                                                     |
| Data layer           | react-query 5 (`useSuspenseQuery` for the old global-suspense default, `useQuery` for enabled/placeholder queries), `isPending`, `gcTime`, `throwOnError`, `initialPageParam`, object-form refetch/invalidate                                  |
| Routing/UI           | react-router 7 (direct), motion 14, react-spring 10.0.4, downshift 9, ky 2.1, @ariakit 0.4.42, React Virtual 3.14, React QR 4.1, nanoevents 10, nanoid 6, uuid 14                                                                              |
| Toolchain            | Kept main's Vite+/Vitest/Oxlint/Oxfmt; `@tanstack/eslint-plugin-query` and `confusing-browser-globals` removed as unused; `eslint-plugin-security` 4 for Oxlint; `dotenv` pinned to 16 (18 breaks Vitest's `vmThreads`)                        |

## Remaining audit findings

`npm audit` is **6 low, 0 moderate/high/critical**. All six are the same
`elliptic` advisory reached through
`vite-plugin-node-polyfills → node-stdlib-browser → crypto-browserify`. The
advisory has no fixed version; `npm audit fix --force` proposes downgrading the
Vite polyfill plugin to 0.2.0, a breaking change. The polyfill is build-time
plumbing for web3 libraries, not the wallet's key/signing path (noble, ethers,
and WebCrypto). Accepted as low risk pending an upstream fix.

## Compatibility pins (intentional)

| Package                            | Pinned at             | Why not latest                                                                                |
| ---------------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `@noble/ed25519` / `@noble/hashes` | 3.1.0 / 2.2.0         | `ed25519-hd-key@2.0.0` depends on these exact versions; upgrading duplicates the crypto code. |
| `@types/node`                      | 24.x                  | Matches the Node 24 CI runtime; latest 26 targets Node 26.                                    |
| `bignumber.js`                     | 9.3.1                 | v11 removes the namespace type used in 48 call sites.                                         |
| `dotenv`                           | 16.4.5                | 18's minified CJS entry fails to parse in Vitest's `vmThreads` pool used by this repo.        |
| `react-router`                     | 7.18.4                | v8 is a new major; API churn is unrelated to supply-chain risk.                               |
| `tsrs`                             | `0.18.0-ts7.1.0-dev…` | The `0.0.0` "latest" is a dist-tag artifact; main pins the TS 7.1 dev build.                  |
| `typescript`                       | 5.9.3                 | TypeScript 7 is a new compiler generation; no dependency requires it.                         |
| `eslint-plugin-security`           | 4.2.0                 | Current; v4 works with Oxlint's JS plugin API.                                                |

`@solana/kit/program-client-core` and the old Parcel aliases are no longer
needed: the Vite build resolves Solana 3 and ethers 6 directly.

## Supply-chain notes

- `npm audit` high/critical is **0**; the 41 findings on main were mostly
  old `ws`, `base-x`, `bn.js`, `shell-quote`, `js-yaml`, `minimatch`, and
  `browserslist`.
- Overrides are patch-level except `uuid` (8 → 11, only v4 is used) and
  `js-yaml` 3 → 4 (the only consumer uses the compatible `load()` API).
- `npm ci` installs with package scripts blocked by npm's `allowScripts` policy;
  build/test/lint work without approvals.
- No git/tarball dependencies or unknown registries.

## Verification

- Clean `npm ci` from the final lockfile.
- `npm run lint:check`, `npm run format:check`, `npm run typecheck`.
- `npm run test:unit` — 61 suites, 496 tests.
- `npm run build:production` — Chrome and Firefox.
- New tests: ethers HD/valueToHex parity, Solana restore/signing/SPL instruction
  encoding, blockies golden hashes.

Caveat: the react-query suspense/placeholder conversion is covered by
typecheck/build/unit gates; the browser e2e suite was not run in this pass.
