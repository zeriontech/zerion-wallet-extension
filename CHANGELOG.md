# zerion-wallet

## 1.46.0

### Minor Changes

- 70f86cc: Beta channel: every push to `main` builds the same extension bundle with the coral beta artwork, its own Firefox add-on id and a fourth manifest version part, and uploads it to the separate Chrome Web Store and AMO beta listings. Production releases upload to the production listings from the tag build. Both uploads are skipped when the store item ids are not configured.
- 70f86cc: Release engineering: releases are cut through changesets (`Version Packages` PR → app-token `vX.Y.Z` tag → tag-triggered build, GitHub Release and QA branch), PRs must carry a changeset or the `skip-changeset` label, and `publish-stores.yml` handles manual Chrome Web Store and Firefox AMO submission.
- 2b10467: Send form: show the in-band get-send/v1 error (e.g. "This token can't be transferred") as a banner, render the network fee for error responses that carry one, and show a "Top up your wallet" button when the backend hints it — with the deposit form pre-filled with the missing asset when known. Amounts above the held balance are no longer sent to the backend and disable the button with "Insufficient balance". Responses from a previous token, amount or recipient are no longer shown, simulated or signed.
- b33b978: Remember the last network fee level per chain, keep Custom fees for 24 hours, and show the selected level inline on the fee row. The speed picker now uses the final bolt/hourglass/sliders design, and fee-level changes emit analytics.
- 5bd6ee9: Build and checks run on Vite+: Parcel is replaced by `vp build` (Rolldown) for both extension targets, ESLint by Oxlint, Jest by Vitest, and `tsc` by TSRS (Prettier stays the format gate). PR gates run static checks, unit tests and the production build in parallel; the Chrome build drops from ~14 s to ~1.6 s and the unit suite from ~22 s to ~9 s on the same machine.
- a810850: Add device-wide hidden fungibles, report a token as spam when it is hidden, and track hide/unhide events.

### Patch Changes

- 504b10b: Beta build: read the manifest version suffix from `BETA_VERSION_SUFFIX` when the
  `--version-suffix` flag is not passed. `beta.yml` only exported the variable, so
  the beta ZIP kept the production version and the store packaging step refused it
  (`dist/manifest.json has version 1.45.2, but the build should be 1.45.2.<run>`),
  which failed the beta workflow on every `main` push.
- e9e0689: One CI workflow instead of four: `ci.yml` carries the changeset gate, static
  checks, unit tests, the production build (with its zip attached to the PR by the
  build job itself) and the sharded e2e suite. The quality gate — static checks, unit tests and the e2e matrix — lives in
  `_quality.yml` and is called by `ci.yml` (pull requests) and `beta.yml` (every
  push to `main`, before the beta build), both with `secrets: inherit`. The
  separate `pr.yml` /
  `pr_attach_build.yml` build path and the `zerion-wallet-extension-qa` mirror
  (`pr_push_qa.yml`, `release_push_qa.yml`, the `push_qa_repo` action and the dev
  manifest script) are gone; QA installs come from the build artifact on the PR.
- e9e0689: Store credentials live in the `store-publishing` environment. `beta.yml` and
  `release.yml` submit from a dedicated job (`publish` / `submit-stores`) that
  declares the environment and consumes the packaged ZIPs as an artifact, so the
  build jobs never receive store secrets and required reviewers, if configured,
  gate only the upload.
- d45b8f5: Send hides the previous quote and keeps Send disabled while a typed amount is still debouncing, so a stale transaction is never simulated or signed. An empty, zero or non-integer ERC-1155 amount sends no get-send request.
- 53b688a: Stop the background worker from refreshing Mixpanel user properties on every
  wake-up. A session restored at worker start no longer sends a Mixpanel identify;
  a real unlock or an analytics opt-in still does. User properties are no longer
  built from the `wallet/check-activity/v1` request, which now runs only during
  wallet import. The `num_funded_wallets_with_provider`, `num_funded_evm_wallets`
  and `num_funded_solana_wallets` user properties are no longer sent, so Mixpanel
  keeps each profile's last value.
