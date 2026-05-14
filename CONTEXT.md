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

## Flagged ambiguities

- "Slippage" was used by some contributors to mean both the user's tolerance setting (the slippage parameter on the swap) and any output divergence — resolved: the latter is **Output mismatch**, the former is just "slippage setting / tolerance".
- "Warning" overlaps with "error" in the API and the UI. Resolved: in the UI, `TransactionWarning` has two visual variants (`warning` and `error`), but both are types of "warnings" conceptually — the distinction is severity-driven, not categorical.
