# Zerion Wallet Extension

A browser extension wallet supporting EVM and Solana. This document captures language used across the codebase that's specific to the wallet/swap/security domain.

## Language

### Pre-sign transaction state

**Quote**: A swap router's offer: an expected `outputAmount`, a guaranteed `minimumOutputAmount`, and the EVM/Solana transaction(s) that realize the swap. _Avoid_: Offer, route, swap details

**Simulation**: A pre-flight execution of a transaction against a forked chain that predicts outcomes (transfers, approvals, status, gas). _Avoid_: Preview, dry run, interpretation (although the API endpoint is named `simulate-transactions`, the result is consumed via `interpretTxBasedOnEligibility`)

**Address Action**: The semantic interpretation of a transaction — its transfers, approvals, status (`confirmed | failed | pending | dropped`), and labeling — as opposed to raw EVM/Solana bytes. Returned by the simulation API. _Avoid_: Action, interpreted transaction

**Severity**: Backend-classified risk level attached to a simulation warning. Four values: `Red`, `Orange`, `Yellow`, `Gray`. Sourced from Blockaid. _Avoid_: Risk level, warning level

**Unverified transaction**: A transaction we couldn't fully simulate or security-check. Today triggered by `Gray` severity; extended to include cases where simulation returned partial data (no action, no transfers, no transfer matching the expected output token, or multiple matching transfers). Surfaced via `<UnverifiedWarning />`. _Avoid_: Unsimulated, unchecked

**Output mismatch**: A divergence between the quoted `outputAmount` and the simulation's actual incoming transfer for the output token. Treated as effectively-exact: the threshold is a tiny epsilon (1e-6 relative), not a slippage tolerance. Both directions trigger it (receiving more than quoted is also a mismatch). Surfaced via `<TransactionWarning>` as a red error. See [ADR-0001](./docs/adr/0001-output-mismatch-uses-epsilon-not-percentage.md). _Avoid_: Slippage warning, output drift, price impact (which is a separate, pre-simulation concept)

**Price impact**: A pre-simulation, quote-derived signal: the percentage difference between input fiat value and output fiat value. Distinct from output mismatch (which is post-simulation, quote-vs-actual). _Avoid_: Slippage, output mismatch

**Effective gas price**: The single per-gas price a transaction will actually pay, collapsing legacy and EIP-1559 forms. Legacy: `gasPrice`. EIP-1559: `min(maxFee, baseFee + maxPriorityFee)`, using the _current_ base fee from `chain/get-gas-price` (in the extension, `gasPrices.fast.eip1559.baseFee`). The quote ships no base fee, so the current one is used for the quote's "original" price too — exactness isn't required, the goal is to convey scale. _Avoid_: Gas price (ambiguous between the raw field and the collapsed value).

**Displayed network fee (Swap)**: The network fee shown in SwapForm2's quote details after a local gas override, computed _without refetching the quote_ as `quote.networkFee.amount × (newEffectiveGasPrice / originalEffectiveGasPrice)`. The original price comes from `transactionSwap` only; the new one from the selected fee setting (Fast/Average preset → current `chain/get-gas-price`; Custom → user values). Recomputes on user change _and_ on the gas-price poll (live base fee). `free` stays "Free"; ratio falls back to 1 on missing/zero/Solana. _Avoid_: Quoted fee (that's the backend's "fast" baseline), estimated fee.

**Transaction configuration (Swap)**: The gas override applied to a quote's transactions before simulation and signing, via `applyTransactionConfiguration(quote, config, gasPrices) → quote`. It rewrites `transactionSwap` gas fields directly (from preset or custom), then scales `transactionApprove` _proportionally_ by the swap's two relative changes — effective-gas-price ratio and gas-limit ratio (the latter is 1 unless a custom gas limit is set). EVM-only; Solana and null-gasPrices pass through unchanged. Distinct from `applyConfiguration` (single-tx, absolute values, used by SendTransaction _and_ SendForm2). _Avoid_: Apply config (ambiguous with the single-tx helper).

**sendQuote (Send)**: A quote-shaped view of a prepared send, returned by `useSendTransaction` as `Pick<Quote2, 'networkFee' | 'transactionSwap'>` (plus Send-only `inputAmount`/`error`/`network`). It exists so SendForm2 can feed the _same_ shared network-fee dialog and fee helpers SwapForm2 uses, with no `Quote2`-vs-`NetworkFeeType` special-casing. `transactionSwap` carries the **backend** `TransactionEVM` (field names `gas`/`maxFee`/`maxPriorityFee`), _not_ the client `IncomingTransaction` (`gasLimit`/`maxFeePerGas`/…) — the helpers read backend names. Both the backend (`get-send`) and local (`prepareSendData`) prep paths are normalized to this single backend shape **inside `useSendTransaction`**, gas-unapplied; `prepareSendData` itself is left untouched (still shared with legacy SendForm). `networkFee.amount` is built as a real `Amount` by injecting the active `currency`; its `value` may stay null (backend often omits it) — SendDetails still recomputes the collapsed fiat display via its own fungible-price query. _Avoid_: send basis, fee basis (too generic), "the send quote" (there is no swap quote here — it's a synthesized shape).

### Slippage & autoslippage

**Slippage setting (Swap)**: The user's tolerance for output divergence, held in `formState.slippage` (URL-only, no cross-session persistence) as either `'auto'`/absent or a numeric **fraction** string (e.g. `'0.005'` = 0.5%). The `SlippageSettings` dialog reads/writes it via `CustomConfiguration.slippage` (a fraction or `null`). _Avoid_: Slippage (bare — ambiguous with Output mismatch / Price impact), tolerance percent (it's a fraction internally).

**Auto mode**: Slippage left for the backend to choose — the quote request omits the `slippage` param, so the backend computes one. Active when `formState.slippage` is absent or `'auto'` _and_ the user is in the autoslippage **Test group**. Distinct from a manual selection (0.5% / 1% / Custom). _Avoid_: Automatic slippage (the engine value is `autoSlippage`; the mode is "Auto mode").

**autoSlippage (quote field)**: `quote.autoSlippage` — the value the backend's autoslippage engine computed, populated **only** when the request omitted slippage (Auto mode), `null` otherwise. Maps to the analytics `autoslippage` property. Distinct from **finalSlippage**. _Avoid_: Computed slippage, engine slippage (use the field name).

**finalSlippage (quote field)**: `quote.finalSlippage` — the slippage actually applied to the quote, in percent (e.g. `0.5` = 0.5%). Present in both manual and Auto modes. Maps to the analytics `slippage` property ("effective slippage the tx uses"). Already drives the `Auto · X%` UI display. _Avoid_: Applied slippage, effective slippage (use the field name).

**Autoslippage experiment**: The Statsig A/B experiment `web_-_autoslippage_testing` gating whether SwapForm2 offers Auto mode. **Test group** (`group_name` e.g. `'Group1'`) sees the Auto option and defaults to it when slippage is untouched; **Control** (and any unresolved/failed state) hides Auto entirely and defaults to the static chain default from `getSlippageOptions`. The resolved `group_name` is reported to analytics as `autoslippage_test_group`. _Avoid_: Autoslippage flag, feature gate (it's an experiment with a group label, not a boolean gate).

### Form state

**Cross-ecosystem swap**: A swap where the input network and output network belong to different ecosystems (`Networks.getEcosystem()` returns different values, e.g. `evm` vs `solana`). Distinct from "cross-chain": Ethereum → Base is cross-chain but same-ecosystem; Ethereum → Solana is both. The user's wallet address on the source ecosystem is not a valid recipient on the destination, so an explicit `to` is required before a quote can be fetched. _Avoid_: Cross-chain (when you mean ecosystem specifically).

**Receiver ecosystem mismatch**: The state where a resolved receiver address (`to`) belongs to a different ecosystem than the output network. Only meaningful inside a Cross-ecosystem swap. Blocks quote fetching and surfaces as an inline error on the address input. Distinct from a malformed/unresolvable address (which never produces a `to` at all). _Avoid_: Wrong address, invalid recipient (too generic).

### Recipient picker

**Receiver picker dialog**: A full-screen Dialog2 that lets the user pick a recipient address from grouped suggestions. Decoupled from any specific form — the trigger (e.g. SwapForm2's `ReceiverAddressSelector`) owns the open/close state and the resolved `to`. Distinct from the SendForm's inline popover-style picker, which lives inside a form fieldset and renders an anchored dropdown. _Avoid_: Address picker (ambiguous between dialog and inline forms), recipient modal.

**Exact match**: A section at the top of the Receiver picker dialog that surfaces the address resolved from the user's typed query (raw EVM/Solana address, ENS, Lens, or UD). Always rendered as a single row when a `resolvedAddress` exists and passes the dialog's `predicate`. Distinct from a row in Recents / My wallets / Watchlist that happens to also match the query — Exact match wins, and the same address is deduped out of the lower sections. _Avoid_: Match, top result, resolved address row.

**My wallets**: Section in the Receiver picker dialog showing wallets the user **owns** (i.e. has private keys for). Distinct from **Watchlist**. Sourced from `walletGroups` minus the `WATCHLIST_WALLET_LIST_GROUP_ID` group.

**Watchlist**: Section in the Receiver picker dialog showing **readonly** wallets the user has added without keys. Sourced from `walletGroups` filtered to `WATCHLIST_WALLET_LIST_GROUP_ID`. iOS designs may call this "Following"; in the extension, the canonical term is Watchlist. _Avoid_: Following (iOS-only), saved addresses (too generic).

## Relationships

- A **Quote** produces zero or more transactions (`transactionApprove`, `transactionSwap`).
- A **Simulation** runs against a Quote's transactions and returns an **Address Action** + a list of warnings (each with a **Severity**).
- An **Output mismatch** is detected by comparing the Quote's `outputAmount` against the matching incoming transfer in the simulated **Address Action**.
- An **Unverified transaction** is the absence of evidence — either the **Simulation** said "Gray" or it didn't return enough data to run the **Output mismatch** check.

## Example dialogue

> **Dev:** "If the **Quote** says we'll get 100 USDC and the **Simulation** shows 99.5 USDC arriving, do we block the user?"
>
> **Domain expert:** "Yes — that's an **Output mismatch**. We've decided that any meaningful divergence is a problem, not just a >2% one. The **Quote** is what we promised; the **Simulation** is what's actually going to happen."
>
> **Dev:** "What if the **Simulation** comes back with no transfers at all?"
>
> **Domain expert:** "Then we treat it as an **Unverified transaction** — same UX as a `Gray` **Severity** warning. We can't see what's happening, so we don't auto-confirm; the user has to click again."

### Address Book

**Address Book**: A user-curated, per-WalletRecord list of saved external addresses with optional names. Surfaced at `/address-book` and (eventually) inside address selectors as a quick-pick list. Stored on `PublicPreferences.addressBook` alongside `recentAddresses`. Distinct from **Manage Wallets**, which lists the user's _own_ wallets — the Address Book is for _external_ contacts (other people's addresses the user transacts with). _Avoid_: Contacts, Saved Wallets, Favorites.

**Address Book entry**: `{ address: string; name?: string }`. Uniqueness within the book is by `normalizeAddress(address)` (case-insensitive for EVM). `name` is optional — when absent, the UI falls back to the same display chain used elsewhere: social handle from wallet meta → ENS/SNS domain → truncated address. An entry with a name is no more "real" than one without; the empty-name state is intentional and expected.

**Recent addresses (in Address Book context)**: The same `PublicPreferences.recentAddresses` array that powers the Send form's recipient suggestions. On the `/address-book` settings page, filtered to exclude addresses already saved in the Address Book — shown in a separate section at the bottom of the page so the user can quickly promote a recent recipient into a saved contact. In the Receiver picker dialog, the Recents section is NOT filtered against the Address Book (an address can appear in both), but capped to the last 3 entries to keep the dialog scannable. _Avoid_: Suggested contacts (recents are not suggested _by us_ — they're a usage trail).

## Relationships

- An **Address Book entry** and a **Recent address** behave differently on each surface. On the `/address-book` settings page they never coexist — saving a recent removes it from the visible recents section (it stays in `recentAddresses` storage, but the filter hides it). In the Receiver picker dialog they CAN coexist — the picker shows both Recents (capped to the last 3) and the Address Book section independently, so the user sees the same address twice if it's in both.
- An **Address Book entry** and a **My wallets** / **Watchlist** row CAN coexist for the same address in the Receiver picker dialog — no dedupe between Address Book and the wallet-ownership sections. Each section has a distinct lens (saved contact vs. owned/watched wallet) and the user may intentionally surface an address in both.
- The **Address Book** lives on `PublicPreferences` (per-WalletRecord, behind login), _not_ on `ChainConfigStore` (global). The initial framing of "same level as chain configs" was overridden in favor of consistency with `recentAddresses`, which we cross-reference.

### Network picker

**NetworkSelect2**: A full-screen Dialog2 + ariakit Combobox that lets the user pick a chain. Lives at `src/ui/components/NetworkSelect2`. Dialog-only — the caller owns the trigger button and the `open` state (mirrors [[Receiver picker dialog]]). Replaces the per-form `NetworkSelectorDialog` inside the SwapForm2 and SendForm2 asset selectors. Distinct from the legacy `NetworkSelect` (`ui/pages/Networks/NetworkSelect`), which bundles a trigger button + bottom-sheet dialog and is still used by Overview / History / legacy SendForm/SwapForm/BridgeForm — those are not in scope for this migration. _Avoid_: NetworkSelectDialog (legacy), chain picker.

**Network predicate (NetworkSelect2)**: The capability filter the caller passes (`(network) => boolean`). Encodes "what kind of operation am I picking a chain for" — e.g. `supports_sending`, `supports_nft_positions`, `supports_trading || supports_bridging`, or "chains the wallet has positions on". Layered on top of two filters the dialog applies internally: (1) `standard` (ecosystem — EVM / Solana / all), (2) testnet visibility, derived from `preferences.testnetMode.on`. Callers should _not_ duplicate testnet/ecosystem filtering in the predicate; the dialog owns those. _Avoid_: filterPredicate (legacy term that conflates capability with testnet/ecosystem).

**ChainDistribution (NetworkSelect2 input)**: The wallet's per-chain fiat values, sourced from `WalletPortfolio` (`useWalletPortfolio`). Drives both the right-side balance display on each row and the sort order in the "Main" section. Passed in by the caller — the dialog does not fetch it. When a row's chain isn't in the distribution, the dialog falls back to a per-row `useNativeBalance` query so the user still sees a balance for chains they haven't yet held positions on. _Avoid_: portfolio (too generic), balances (ambiguous between row-level and aggregate).

**`NetworkSelectValue.All` sentinel**: The string `'all'` that `onSelect` emits when the user picks the "All Networks" row. Only emitted when the caller passes `showAllNetworksOption: true`. Callers translate it to their own local sentinel (e.g. SwapForm2's `ALL_NETWORKS_TAB_ID` → `null` for "no chain filter"). The sentinel-in-the-value shape is intentional and matches the rest of the codebase (URL params, global current-network preference). _Avoid_: null/undefined for "all" (the sentinel is the convention).

**Side effects on pick**: When a chain is selected, NetworkSelect2 always fires `addVisitedEthereumChain` + `updateNetworks` (mainnet + testnet stores). These are about chain-config hydration — making sure a newly-added or rarely-used chain is fully loaded. Notably it does _not_ fire `walletPort.request('uiChainSelected')` — that would update the global "current network" preference (used by the dapp connection UI / overview page), and form-local chain selection should not leak into that global state. The old `NetworkSelect` does fire `uiChainSelected`; NetworkSelect2 deliberately diverges. _Avoid_: "current network" (means global pref, not form selection).

### Onboarding

**Cross-chain swap onboarding**: A one-time, full-bleed Dialog2 shown on first visit to `/swap-form` (SwapForm2) that introduces the new cross-network swap flow. Persisted as `PublicPreferences.crossChainSwapOnboardingShown` — `undefined` means "not yet shown" (default → show). Written to `true` on explicit dismissal (Continue button / backdrop click / Escape) but NOT on navigation-away or on dev-menu-triggered dismissal. Scoped to `/swap-form` only — does not trigger on legacy `/swap-form-old` or `/bridge-form-old`. The dev menu's `disclaimers` section exposes a `show_swap_onboarding` button that opens the dialog via an in-memory `store-unit` signal without touching the persisted flag. _Avoid_: "swap onboarding" (ambiguous between this and any future swap-related guidance), "first-run dialog" (too generic).

**Swap button onboarding**: A one-time Dialog2 shown on the **first tap** of the SwapButton (the simulation/interpretation trigger). "Set. Tap. Swap." — introduces one-tap swaps + Blockaid protection. Persisted as `PublicPreferences.oneTapCrossChainSwapOnboardingShown`. Written to `true` ONLY on the primary CTA (Continue Swap), which then resumes the gated `fire()` → simulation kicks off. Cancel / backdrop / Escape close the dialog without persisting; next SwapButton tap re-shows it. Architecturally mirrors `useReadonlyReceiverGate` — a `useSwapButtonOnboardingGate({ fire })` hook returns `{ guardedFire, dialog }`. Composition order in SwapButton is **readonly-receiver → swap-button-onboarding → fire**: readonly gate runs first. Only intercepts pre-simulation taps (`simulated === false`); the post-simulation "Confirm Swap" tap is never gated. Independent of [[Cross-chain swap onboarding]] — both flags fire on their own triggers, no suppression, so a brand-new user sees both dialogs in succession during their first swap. Dev menu's `disclaimers` section exposes a `swap_button_onboarding → reset` button that writes the persisted flag back to `false` via `setPreferences` — no in-memory force-show layer, so the dialog re-opens through the natural gate on the next tap. _Avoid_: "swap onboarding" (collides with cross-chain one), "hold-to-swap onboarding" (hold-to-sign is a separate opt-in preference).

### Home / Overview CTA

**Action buttons row**: The row of primary call-to-action buttons at the top of the Overview/Home portfolio view (`ActionButtonsRow`, rendered by `Overview.tsx`; hidden for readonly wallets, replaced by `ReadonlyMode`). As of WLT-1407 it is four equal-width icon+label cards — **Buy**, **Receive**, **Send**, **Swap** — matching the iOS design 1:1 (56px tall, 16px radius, 8px gap; first three on `--neutral-100`, Swap on `--black`). Previously three icon-only circular buttons (Fund, Send) plus a Swap pill. _Avoid_: Quick actions, CTA row (when you mean this specific component use the component name).

**Buy**: The CTA that opens `app.zerion.io/deposit` (the on-ramp / "buy crypto" web flow) in a tab, via `useOpenAndConnectToZerion`. Analytics: `buttonClicked` with `buttonName: 'Buy Crypto'`. Was previously the first option inside the **Fund** dialog. _Avoid_: Deposit, On-ramp (those name the destination, not the button), Fund.

**Receive**: The CTA that navigates to `/receive` (QR code + wallet address to receive crypto from another wallet/exchange). Analytics: `buttonClicked` with `buttonName: 'Receive Crypto'`. Was previously the second option inside the **Fund** dialog. _Avoid_: Fund.

**Fund (retired in the row)**: The former single button in the action row that opened a bottom-sheet (`AddFundsOptionsDialog`) offering a choice between **Buy** and **Receive**. WLT-1407 removed it from the action row in favor of showing both choices directly as their own buttons. The `AddFundsOptionsDialog`/`AddFundsOptionsContent` chooser still exists and is still used by `EmptyPositionsView` ("Get Started") and `SwapForm2`'s `TopUpWalletCTA` — "Fund" as a _chooser dialog_ lives on; only its presence in the action row is gone. _Avoid_: assuming "Fund" is fully deleted.

## Flagged ambiguities

- "Slippage" was used by some contributors to mean both the user's tolerance setting (the slippage parameter on the swap) and any output divergence — resolved: the latter is **Output mismatch**, the former is just "slippage setting / tolerance".
- "Warning" overlaps with "error" in the API and the UI. Resolved: in the UI, `TransactionWarning` has two visual variants (`warning` and `error`), but both are types of "warnings" conceptually — the distinction is severity-driven, not categorical.
