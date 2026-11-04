# Source code review

This repository builds the Zerion Wallet browser extension for Chrome and Firefox. The Firefox build submitted to AMO is produced from exactly these sources: the sources ZIP is `git archive` of the released tag, created by `scripts/release/store-zips.mjs`.

## Requirements

- Node.js `>=20.10` (CI uses `24.x`), npm `>=11.10`

## Rebuild

```shell
npm ci
npm run build:firefox
```

The unpacked extension is written to `dist-firefox/`. `npm run build:chrome` writes `dist/`. Both use [Parcel](https://parceljs.org/) and pass `--no-content-hash --no-source-maps`, so output file names are stable.

## Build-time environment

`src/env/config.ts` requires four non-secret variables at build time:

```shell
export ZERION_API_URL=https://zpi.zerion.io/
export ZERION_TESTNET_API_URL=https://zpi-testnet.zerion.io/
export DEFI_SDK_TRANSACTIONS_API_URL=https://transactions.zerion.io
export PROXY_URL=https://proxy.zerion.io/
```

The release build additionally injects `MIXPANEL_TOKEN_PUBLIC`, `GOOGLE_ANALYTICS_MEASUREMENT_ID`, `GOOGLE_ANALYTICS_API_SECRET`, `TEST_WALLET_ADDRESS` and `FEATURE_*` flags from CI secrets. Those values are not part of the sources, so a local rebuild differs from the submitted bundle only in those injected strings.

## Notes

- `package-lock.json` is committed and `npm ci` installs from it; the `min-release-age=15` policy in `.npmrc` only affects version resolution, not installs from the lockfile.
- No code is fetched at build time: all dependencies come from the npm registry at the versions pinned in `package-lock.json`.
