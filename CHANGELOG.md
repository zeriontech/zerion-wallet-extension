# zerion-wallet

## 1.47.0

### Minor Changes

- 46bc55a: Safe transaction previews now resolve the chain from the typed data's EIP-712 domain, so a Safe transaction signed on Base is previewed and simulated on Base even when the dapp's selected chain is Ethereum, and the resolved network is shown on the preview. Other typed data keeps using the dapp's selected chain without a network row.
- 73f06db: Safe transaction previews now name the Safe as the account whose balances change, point each asset link at the Safe's portfolio, and keep the "Safe transaction" note visible on both confirmed and reverted simulations.
- 54f3a03: Render Gray simulation warnings as neutral info cards, including on a clean Safe transaction preview. Each warning card now takes its own severity color, the security status no longer says "Unverified" for a successfully simulated Safe transaction, and repeated warning titles no longer collide as React keys.
- 220b4a1: Ledger owners signing a Safe transaction on app.safe.global now see the Safe and nonce, the transaction network when the shared preview row cannot show it, every call decoded from the typed data (including each call inside a MultiSend batch), any refund, and the three EIP-712 hashes the device displays. The section is display-only, needs no simulation, and keeps signing enabled on every chain.

### Patch Changes

- 43cfe33: Internal: remove three unused local address-action builders and rename the live ones (drop the `2` suffix).
- 70cd001: Respect the "analytics disabled" setting for passkey, password-change and recovery-phrase restoration events, which were still being reported.
- d82ff9a: Build: drop `DEFI_SDK_TRANSACTIONS_API_URL`, `FEATURE_BRIDGE_FORM` and `FEATURE_SEND_FORM` from the build environment; nothing read them. Developers must delete the first two keys from their local `.env` (the pre-start check rejects keys that are not in `.env.example`).
- b6f9965: Requests from web pages are dispatched only to the wallet's declared RPC methods; internal helpers can no longer be invoked by name.
- a00be62: Internal: dapp signing requests (transactions, messages, typed data, Solana) share one permission check and one approval-dialog opener. Behaviour is unchanged, including the order in which the checks run.
- e6749da: Internal: removed the proactive recovery-phrase reminder, which had been inactive since its feature gate was removed. The restoration dialog still opens when a recovery phrase cannot be decrypted.
- 65ddd1f: Internal: delete source files that nothing imports (unused hooks, components and helpers).
- 5dbe423: Dependency reduction: no user-facing behavior change.

  Tiny or low-usage packages were replaced with ModernDash, native code, or small
  local modules. Large/core libraries (ethers, Solana web3, React, react-query,
  motion, downshift, ky) were deliberately left alone.

  | Replaced                                                                                                             | With                                    | How / why                                                                                                                                                                                                                                                                                                                                       |
  | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `lodash` subpath imports (`memoize`, `debounce`, `omit`, `set`, `merge`, `groupBy`, `sortBy`)                        | `moderndash`                            | Modern, maintained, tree-shakable utility library; same call sites, native code for `noop`.                                                                                                                                                                                                                                                     |
  | `lodash/throttle`                                                                                                    | `moderndash/debounce`                   | All three call sites only need trailing invocation (preferences refresh, query-cache persistence, window resize). ModernDash's throttle is leading-only, so debounce is the correct primitive.                                                                                                                                                  |
  | `memoize-one`                                                                                                        | `src/shared/memoizeOne`                 | Thin last-call wrapper on ModernDash `memoize`; keeps `===` argument comparison and a single cache entry.                                                                                                                                                                                                                                       |
  | `capitalize-ts`                                                                                                      | `src/shared/capitalize`                 | One-line function. ModernDash `capitalize` lowercases the tail, so it was not a behavior-preserving drop-in.                                                                                                                                                                                                                                    |
  | `is-truthy-ts`                                                                                                       | `src/shared/isTruthy`                   | The package is a single `value != null` check.                                                                                                                                                                                                                                                                                                  |
  | `normalized-contains`                                                                                                | `src/shared/normalizedContains`         | Five-line NFD diacritic strip; preserves the package's case-sensitive behavior.                                                                                                                                                                                                                                                                 |
  | `get-error`                                                                                                          | `src/shared/errors/getErrorBase`        | Vendored MIT implementation of the 100-line normalizer with the same branch order.                                                                                                                                                                                                                                                              |
  | `store-unit` + `@store-unit/react`                                                                                   | `src/shared/store`                      | Low-usage core primitive. `Store`/`FormDataStore` are vendored; hooks match store-unit's `useState`/`useEffect` semantics exactly. A `useSyncExternalStore` rewrite changed update timing and triggered React error #426 during navigation, so it was discarded.                                                                                |
  | `react-area`                                                                                                         | `src/shared/react-area`                 | Low-usage alpha package; local provider/content implementation preserves the layout-composition behavior.                                                                                                                                                                                                                                       |
  | `@download/blockies`                                                                                                 | `src/ui/components/BlockieImg/blockies` | Unmaintained identicon renderer; local port keeps pixel-identical output (golden tests).                                                                                                                                                                                                                                                        |
  | `normalize.css`                                                                                                      | `src/ui/style/normalize.css`            | Vendored MIT stylesheet; removes an unmaintained release dependency without changing reset rules.                                                                                                                                                                                                                                               |
  | `@solana/spl-token`                                                                                                  | `src/modules/solana/splToken`           | Only one call site; local transfer/ATA/mint-decimals builders remove the `bigint-buffer` high-severity tree.                                                                                                                                                                                                                                    |
  | `rlp`                                                                                                                | `ethers.encodeRlp`                      | Ethers already ships RLP; the one call site normalizes odd-length hex and preserves RLP's integer encoding. Temporary parity test passed before removal.                                                                                                                                                                                        |
  | `dayjs`                                                                                                              | `src/shared/date`                       | Only a small API subset was used. The local helper preserves dayjs formatting, local-time parsing, add/start/end/diff, comparisons, hour set/get and relative-time output. dayjs never had `customParseFormat` installed, so its format argument was already ignored; that behavior is preserved. Temporary parity tests passed before removal. |
  | Unused: `@ethersproject/abstract-provider`, `bip32`, `@noble/ed25519`, `stream-browserify`, `buffer`                 | —                                       | No imports; removed.                                                                                                                                                                                                                                                                                                                            |
  | Unused dev: `@tanstack/eslint-plugin-query`, `@types/lodash`, `@types/socket.io-client`, `confusing-browser-globals` | —                                       | No references after the toolchain migration; removed.                                                                                                                                                                                                                                                                                           |

  Security patches kept within existing majors: `nanoid` 6, `uuid` 11,
  `react-router-dom` 6.30.6 (`@remix-run/router` 1.23.4), Playwright 1.64.
  React Router 7 fixes its advisory but changed navigation/Suspense timing enough
  to break the onboarding-backup e2e flow, so patched v6 is retained.

  Result: direct dependencies 63 → 46, `npm audit` high/critical 20/0 → 0/0,
  and the Chrome bundle 13.41 MB → 13.25 MB.

- c2023e0: Add unit tests for the injected provider's EIP-1193 events (`connect`, `chainChanged`, `accountsChanged`) and remove an unreachable code path that re-emitted `connect` when a site was approved. Dapps are notified of approval through `accountsChanged`, as before.
- e2ae37f: Hidden Assets: use the crossed-out eye for Hide and the Settings row, and show the one-time "Looks like spam?" hide hint on likely-spam asset pages, mirroring iOS.
- b24c76a: History: the pending row's amount column now ends at the same right edge as the mined rows instead of stopping short of it when the row has no Sign button.
- fd64ad6: Internal: the quote-based network fee dialog and its helpers moved from `SwapForm2` to `src/ui/components/NetworkFeeDialog2`, so the Send form no longer imports them from the Swap page.
- 8318ad7: Network fee row: hovering no longer draws a single blue underline across the whole value. Each text run is underlined in its own color, so the grey Fast and orange Slow/Custom labels match their underline instead of showing the button's blue.
- f8552b0: Internal: the Send and Swap buttons simulate through one shared hook, and the simulation result type is declared once.
- 2ec5eeb: Restore assets that the Vite build lost through Parcel import conventions: the Aeonik Pro `@font-face` rules in a CSS module, the onboarding welcome banner image loaded with `require('url:…')`, and the in-dapp notification logo and close icons.
- b45ce05: Internal: runtime port names are defined once in `src/shared/portNames` instead of being repeated as string literals in the UI, the content script and the service worker.
- fd27778: Internal: the pre-sign warning card, the "unverified" notice and the simulation-warning helpers moved from `SwapForm2` to `src/ui/components/PreSignWarning`, so the Send form and the unknown-receiver dialog no longer import from the Swap page.
- 87cafa4: Swap: when a swap has a price-impact warning, the wallet now pauses after simulating the transaction and asks for confirmation before signing.
- 1917fa1: Fix the wallet provider not being re-injected into pages after a timed "pause on all sites" expires (the content script was registered with an invalid match pattern).
- 0475afc: Internal: the dapp-facing JSON-RPC controller moved out of `Wallet.ts` into its own module. No behavior change.
- 24e2e28: Show Address Book and wallet names for the exact match row in the recipient picker.
- 89d5940: Internal: move the referral program background service and its storage helper from `src/ui/features` to `src/modules/referral-program`, so the service worker no longer imports from the UI tree.
- 4e00788: Internal: the background derives the list of remote-config keys it fetches from the defaults object. It now also fetches `zerion_fee_learn_more_link` and no longer fetches the unused `loyalty_config`.
- 65ddd1f: Internal: delete the unused `useQuotes2` hook (the v1 quotes stream client).
- ce974d0: Internal: the sign-message, sign-typed-data and send-transaction approval views render the requesting site through one shared component. Message requests started by the wallet itself are now labelled "Zerion", like the other two views.
- fd64ad6: Internal: the Send and Swap details cards share one `DetailRow` component, one set of link-row styles and the `NonceLine2` row.
- c8c8051: Internal: skeleton placeholder styles moved from the Swap form's stylesheet to `src/ui/ui-kit/Skeleton`; Send and Perps no longer import the Swap stylesheet.
- 7b55673: Internal: the Send and Swap forms share one definition of the network-fee override fields, one "pin the resolved input into the URL" rule and one change-handler type.
- 67adc98: Recognise the side panel after the Vite build moved its page to `ui/sidepanel.html`. The panel was rendering with the fixed-width popup layout and clipped the right edge when narrower than 425px.
- 3eb759f: Internal: the hold-to-sign buttons (`RegularSignButton`, `DangerSignButton`, `HoldableButton`, `ReadonlySignButton`) moved from `SwapForm2` to `src/ui/components/HoldToSignButton`; Send and Perps no longer import them from the Swap page.
- 625a6c5: Internal: Send, Swap and Perps deposit use one shared helper to wait for the first transaction of a signing queue to be broadcast.
- 436de53: The signing Advanced view no longer repeats a wallet label line above the raw transaction fields; the raw `from`/`to` rows already show that address.
- 14019ab: Signing previews pick the label line by its title: an application label with no known dapp shows an "Application" line instead of "Recipient", and `to`/`from` labels show their own caption. Every label address in the signing preview and the Advanced view now copies on tap instead of opening the explorer. Copies of non-trackable wallets send the `Label Address Copied` analytics event.
- d1ddf14: Internal: the Send and Swap forms share one `AssetSelectorButton` component instead of two identical copies.
- 7f2aab2: The "Signed Transaction" analytics event now reports failed transactions with the same error fields as the iOS app: an error code and stage, the node's own message, and the wallet address, for EVM and Solana broadcasts as well as Solana signing failures. Addresses and hashes are redacted from the reported messages.
- 39c321c: Internal: the transaction poller now treats a failed Solana RPC URL lookup as "no URL" instead of an unhandled rejection.
- 6bf1d32: Swap: the USD values under Pay and Receive and the price impact now use the latest price per token, from the quote or the token data, whichever arrived last, so they match the Rates card right after a quote.
- 60897e8: Swap: MAX in the USD input mode now fills the exact dollar value of the token balance and quotes that exact balance, instead of rounding the dollars to cents and then resolving slightly more tokens than the wallet held (which showed the balance in red). Toggling the input mode after MAX keeps the exact amount.
- 77942f4: Internal: the developer-menu flag that forces the Swap onboarding dialog now lives in the dev-menu feature.
- a83651a: Swap form quote errors follow the cross-platform rules. Insufficient balance and insufficient gas show our own wording with a `Top Up {SYMBOL}` button that opens Add Funds on the missing token, at any input balance. A geo-blocked swap and any other quote error show a gray "Error" card instead of "Transaction will fail", with the backend message for unknown codes.
- 0d8ec82: Swap form: treat quote error code 3 as "no wallet" and show an Add wallet button instead of a "Transaction will fail" warning.
- 802c3f1: Erasing all data — from the forgot-password screen and from Manage Wallets — now requires typing ERASE before the destructive button is enabled. The warning states that every wallet in the extension will be erased and can only be restored from the recovery phrase or a backup.
- 89d5940: Internal: move the typographic string constants to `src/shared/typography`, so `src/shared/units` no longer imports from the UI tree.
- 67815ef: Internal: the UI reports analytics events to the background through a single typed port method instead of one method per event.
- 8e83c1b: Internal: the rule that a signer wallet group takes precedence over a read-only one for the same address is implemented once and covered by tests.
- 29d2660: Fix a race where two quick changes to the wallet (for example a rename followed by a settings change) could be saved in the wrong order and the newer one lost after a restart. Creating or importing a wallet now waits until the wallet is stored before reporting success.
- 3c467cc: Internal: remove wallet controller methods that had no callers and debug-only branches from the dapp connection path.
- 99d4727: WLT-2749: show network fees on expected gas (Send, dapp and the fee dialog), preserve a dapp's higher max fee, clamp EIP-1559 tips to the max fee, and report the selected-speed fee plus gas-service provenance in `signed_transaction`.
- c81b65c: Swap quotes now come from the v3 stream and quote only offers an intent when the connected wallet can sign it. History shows the backend's pending and unsigned actions in a Pending group.
- c136759: Add the execute-order clients and sign EVM and Solana intents on software wallets and Ledger.
- bd1106e: Shield and unshield Zama tokens through the swap form, pre-select the underlying receive token, and send confidential tokens by exact amount.
- 74375c4: Intent swaps execute as an order step and are followed in the transaction toaster until the backend reports a terminal outcome.
- de6b2bc: Sign and Dismiss ready-to-sign pending rows in History behind a pre-sign review and a bounded, shared lock.
- 5c9ce26: Validate Zama decryption permits against the contracts the backend issued before asking software or Ledger to sign.

## 1.46.1

### Patch Changes

- 4fac09b: Restore the UI font and other bundled assets lost in the Vite build: `@font-face` rules are no longer dropped from a CSS module, the onboarding welcome banner loads its background again, and the in-dapp notification logo and close icons resolve.

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
