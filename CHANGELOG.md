# zerion-wallet

## 1.46.1

### Patch Changes

- 43cfe33: Internal: remove three unused local address-action builders and rename the live ones (drop the `2` suffix).
- 70cd001: Respect the "analytics disabled" setting for passkey, password-change and recovery-phrase restoration events, which were still being reported.
- d82ff9a: Build: drop `DEFI_SDK_TRANSACTIONS_API_URL`, `FEATURE_BRIDGE_FORM` and `FEATURE_SEND_FORM` from the build environment; nothing read them. Developers must delete the first two keys from their local `.env` (the pre-start check rejects keys that are not in `.env.example`).
- b6f9965: Requests from web pages are dispatched only to the wallet's declared RPC methods; internal helpers can no longer be invoked by name.
- a00be62: Internal: dapp signing requests (transactions, messages, typed data, Solana) share one permission check and one approval-dialog opener. Behaviour is unchanged, including the order in which the checks run.
- e6749da: Internal: removed the proactive recovery-phrase reminder, which had been inactive since its feature gate was removed. The restoration dialog still opens when a recovery phrase cannot be decrypted.
- 65ddd1f: Internal: delete source files that nothing imports (unused hooks, components and helpers).
- c2023e0: Add unit tests for the injected provider's EIP-1193 events (`connect`, `chainChanged`, `accountsChanged`) and remove an unreachable code path that re-emitted `connect` when a site was approved. Dapps are notified of approval through `accountsChanged`, as before.
- fd64ad6: Internal: the quote-based network fee dialog and its helpers moved from `SwapForm2` to `src/ui/components/NetworkFeeDialog2`, so the Send form no longer imports them from the Swap page.
- f8552b0: Internal: the Send and Swap buttons simulate through one shared hook, and the simulation result type is declared once.
- fd27778: Internal: the pre-sign warning card, the "unverified" notice and the simulation-warning helpers moved from `SwapForm2` to `src/ui/components/PreSignWarning`, so the Send form and the unknown-receiver dialog no longer import from the Swap page.
- 1917fa1: Fix the wallet provider not being re-injected into pages after a timed "pause on all sites" expires (the content script was registered with an invalid match pattern).
- 0475afc: Internal: the dapp-facing JSON-RPC controller moved out of `Wallet.ts` into its own module. No behavior change.
- 89d5940: Internal: move the referral program background service and its storage helper from `src/ui/features` to `src/modules/referral-program`, so the service worker no longer imports from the UI tree.
- 4e00788: Internal: the background derives the list of remote-config keys it fetches from the defaults object. It now also fetches `zerion_fee_learn_more_link` and no longer fetches the unused `loyalty_config`.
- 65ddd1f: Internal: delete the unused `useQuotes2` hook (the v1 quotes stream client).
- ce974d0: Internal: the sign-message, sign-typed-data and send-transaction approval views render the requesting site through one shared component. Message requests started by the wallet itself are now labelled "Zerion", like the other two views.
- fd64ad6: Internal: the Send and Swap details cards share one `DetailRow` component, one set of link-row styles and the `NonceLine2` row.
- c8c8051: Internal: skeleton placeholder styles moved from the Swap form's stylesheet to `src/ui/ui-kit/Skeleton`; Send and Perps no longer import the Swap stylesheet.
- 7b55673: Internal: the Send and Swap forms share one definition of the network-fee override fields, one "pin the resolved input into the URL" rule and one change-handler type.
- 3eb759f: Internal: the hold-to-sign buttons (`RegularSignButton`, `DangerSignButton`, `HoldableButton`, `ReadonlySignButton`) moved from `SwapForm2` to `src/ui/components/HoldToSignButton`; Send and Perps no longer import them from the Swap page.
- 625a6c5: Internal: Send, Swap and Perps deposit use one shared helper to wait for the first transaction of a signing queue to be broadcast.
- d1ddf14: Internal: the Send and Swap forms share one `AssetSelectorButton` component instead of two identical copies.
- 39c321c: Internal: the transaction poller now treats a failed Solana RPC URL lookup as "no URL" instead of an unhandled rejection.
- 89d5940: Internal: move the typographic string constants to `src/shared/typography`, so `src/shared/units` no longer imports from the UI tree.
- 67815ef: Internal: the UI reports analytics events to the background through a single typed port method instead of one method per event.
- 8e83c1b: Internal: the rule that a signer wallet group takes precedence over a read-only one for the same address is implemented once and covered by tests.
- 29d2660: Fix a race where two quick changes to the wallet (for example a rename followed by a settings change) could be saved in the wrong order and the newer one lost after a restart. Creating or importing a wallet now waits until the wallet is stored before reporting success.
- 3c467cc: Internal: remove wallet controller methods that had no callers and debug-only branches from the dapp connection path.

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
