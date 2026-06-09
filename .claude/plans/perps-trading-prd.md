## Problem Statement

Zerion wallet extension users cannot trade Hyperliquid perpetual futures without leaving the wallet. They have to open the Hyperliquid web app in a new tab, connect their wallet, and manage trading state separately from their portfolio. They also can't see their open perps positions, perps PnL, or trade history alongside the rest of their holdings in Overview. The web app and iOS clients already have full perps support; the extension is the gap.

Additional friction unique to the extension form factor: in the web app, every Hyperliquid action requires the user to confirm an EIP-712 signature in a popup. Web mitigates this with an "agent key" approval where one prompted signature authorizes a locally-stored key to sign subsequent orders. In the extension we control the user's private keys directly, so we can do better — sign every action silently in the background with the master key, with no agent layer.

## Solution

Bring Hyperliquid perpetuals into the extension as a first-class surface, adapted from the web app's PR #7 design (`feature/perps-page` / `.claude/plans/perps-trading-design.md`):

- A new **Perps tab** appears in the Overview tab strip (4th segment, fire icon next to "Perps") for EVM bare wallets. Tabbed alongside Tokens / NFTs / History.
- Tab destination is conditional: if the wallet has Hyperliquid funds, it routes to `/overview/perps` (positions + history). If not, it routes directly to `/perps/deposit` so users can fund their account.
- **`/overview/perps`** lists open perps positions and recent perps activity (Trades + Ledger tabs).
- **`/perps/:perpId`** is the per-asset page: ChartJS candle chart, stats, read-only position data, history. Bottom CTAs branch on position state — `Buy Long` / `Buy Short` when flat, `Add to Long|Short` / `Close` when open.
- **`/perps/:perpId/trade`** is a dedicated trading page driven by URL search params (`mode`, `side`, `inputAmount`, `leverage`, `takeProfitPrice`, `stopLossPrice`). Three form modes (open / add / close), two sub-overlays (leverage / auto-close).
- **`/perps/deposit`** is a dedicated bridging form that funds the Hyperliquid account by swapping any asset into Hypercore USDC. Forks the visual primitives from `SwapForm2` but locks the output side. On first visit, opens a 3-screen onboarding Dialog2 over the form, dismissed once and persisted in `PublicPreferences`.
- **`/perps/withdraw`** is a single-input form that withdraws USDC from Hyperliquid to the user's same address on Arbitrum.
- **Search** results show perps markets alongside fungibles/wallets, clicking through to `/perps/:perpId`.
- **All signing is silent** — every L1 action (place order, set leverage) and UserSignedAction (enable Hyperliquid, set referrer, approve builder fee, withdraw) is signed in the background via the existing `signTypedData_v4` wallet method. No agent key, no prompts, no delegation.
- **No in-form success screens.** After a successful trade/deposit/withdraw, the form auto-navigates back to its origin and a global, root-mounted toast appears with a success animation. For deposit/withdraw, copy explicitly notes funds may take a few minutes to settle.
- **A new global perps activity toaster** (a sibling of the existing `TransactionToaster` pill) shows step-by-step progress of multi-step perps flows. The pill survives navigation, so the user can leave the trade page mid-submission.

This is intentionally a single-PR feature, matching the web app's PR #7 model.

## User Stories

1. As a wallet user with USDC on Arbitrum, I want to deposit funds into a Hyperliquid perps account from inside the extension, so that I don't have to leave to bridge.
2. As a first-time perps user, I want a brief explainer of how perpetual futures work, leverage, and liquidation before I see the deposit form, so that I understand what I'm signing up for.
3. As a returning perps user, I don't want to see the onboarding screens again, so that they don't get in my way.
4. As a perps trader, I want to open a long or short position from inside the extension, so that I can act on a trade idea without context-switching.
5. As a perps trader holding an open position, I want to add to that position from inside the extension, so that I can scale into a winning trade.
6. As a perps trader holding an open position, I want to close that position (fully or partially), so that I can lock in profit or cut losses.
7. As a perps trader, I want to set the leverage on a new position via a slider with preset chips (1x, 2x, 5x, 10x, 25x, max), so that I can size my exposure.
8. As a perps trader, I want to set optional take-profit and stop-loss orders alongside a new position, so that I can automate my exit.
9. As a perps trader, I want to enter TP/SL either as a price or as a PnL percentage, so that I can think in whatever frame fits the trade.
10. As a perps trader, I don't want to be prompted to sign 5 separate confirmation dialogs on my first trade, so that I can act fast — the extension knows my keys and can sign silently.
11. As a perps trader, I want to see a single animated progress indicator showing what step the submission is on, so that I know it's not frozen even when 5 signatures and an HTTP POST are happening in sequence.
12. As a perps trader, I want to navigate away from the trade page while my order is being signed/submitted, so that I'm not held captive by the form.
13. As a perps trader, I want a clear success confirmation when my order settles, so that I know it went through without staring at a loading screen.
14. As a perps trader, after a successful trade I want to be returned to the previous page (the perps page or perps tab) so that I land somewhere useful, not on a stale form.
15. As a perps trader, after a successful trade I want my open positions list and history to update immediately, so that what I see matches reality.
16. As a perps trader, when my order is rejected (insufficient margin, rate limited, network), I want a clear error message in the toaster with a way to dismiss it, so that I can retry or change my input.
17. As a perps trader, I want my open positions visible inside the Overview under a "Perps" tab next to Tokens / NFTs / History, so that they live in the same place as my regular portfolio.
18. As a perps trader, I want a quick-glance perps balance and PnL on the Tokens tab, so that I can see at a glance whether my perps account is up or down without drilling in.
19. As a perps trader, I want a per-asset page (e.g. for BTC) with a candle chart, mark price, 24h change, my position, and trade history, so that I can analyze a market before sizing into it.
20. As a perps trader on the per-asset page, I want bottom CTAs that change based on whether I already have a position — "Buy Long / Buy Short" when flat, "Add / Close" when open — so that the next action is always one tap away.
21. As a Hyperliquid user, I want to withdraw USDC from my perps account back to my Arbitrum address, so that I can move funds out of the account.
22. As a Hyperliquid user withdrawing funds, I want to know withdrawal can take a few minutes, so that I'm not anxious when the funds don't appear instantly.
23. As a user typing a search query, I want perpetual markets to appear in the search results alongside tokens and wallets, so that I can jump to BTC perps the same way I jump to a BTC token page.
24. As a watch-address user, I want to see another wallet's perps positions and history (read-only), so that I can follow strategies — but I shouldn't see Trade/Deposit/Withdraw CTAs because I can't sign for that address.
25. As a Solana-only wallet user, I shouldn't see the Perps tab at all, so that the UI doesn't tease me with a feature my wallet type can't use.
26. As a Ledger hardware-wallet user, I shouldn't see the Perps tab, so that I'm not led into a flow that depends on silent in-extension signing.
27. As a perps trader who already enabled Hyperliquid / set a referrer / approved the builder fee in a previous session, I want my subsequent trades to skip those steps automatically, so that placing an order is fast.
28. As a perps trader, I want to see a Zerion fee disclosure on the trade form with a breakdown popover, so that I understand what I'm paying.
29. As a perps trader, I want my leverage choice to show a live liquidation price, so that I can see the risk before I commit.
30. As a perps trader closing a partial position, I want to be prevented from leaving a sub-$10 remainder, so that I don't end up with a position too small to close cleanly.
31. As a perps trader on `/perps/:perpId/trade`, I want my form state preserved in the URL, so that refreshing or back-navigating doesn't lose my work.
32. As a perps trader who opened the trade page with stale URL params (e.g. `?mode=close` but no position), I want the form to gracefully drop those params, so that I don't see a broken state.
33. As a developer maintaining this code, I want the math (liquidation, fees, slippage) and the action serialization (msgpack + EIP-712) to be unit-tested against iOS fixtures, so that a regression doesn't ship wrong orders.
34. As a developer, I want the perps signing flow to use the existing background `signTypedData_v4` method, so that the perps codepath doesn't introduce a new privileged interface to the wallet record.
35. As a developer, I want all new perps copy to be inline English for v1 (matching the web PR's i18n-waiver), so that we ship the feature without blocking on translations.
36. As a wallet user, I want my Overview Tokens tab to still aggregate my Hyperliquid balance into the displayed portfolio total, so that the headline number reflects all my holdings.
37. As a wallet user, after depositing into Hyperliquid I want both my source-chain balance and my Hyperliquid balance to refresh, so that the UI reflects the new state without a manual reload.

## Implementation Decisions

### Domain glossary additions

These terms are introduced by this feature and should be used consistently in code and PRs:

- **Perps account** — the user's Hyperliquid sub-account. Funded with Hypercore USDC; sole settlement currency.
- **Hypercore USDC** — Hyperliquid's native USDC on the Hypercore chain; the only asset that exists inside the perps account.
- **Withdrawable** — `clearinghouseState.withdrawable` from Hyperliquid `/info`. The single source of truth for "available balance" inside the perps account. Not derived from margin summary or unrealized PnL.
- **Perp** — a perpetual market (e.g. BTC, ETH, SOL). Identified by `perpId` in URLs and search results.
- **L1 action** — Hyperliquid action that uses msgpack-hashed EIP-712 typed data with chainId 1337 (placeOrder, updateLeverage, setReferrer).
- **UserSignedAction** — Hyperliquid action that uses regular EIP-712 typed data with real chainId (approveBuilderFee, dexAbstraction, withdraw3).
- **Perps preflight** — the sequence of up to 4 setup actions (enable Hyperliquid, set referrer, approve fee, set leverage) that must precede the first order of a session. State source is `/info`.
- **Perps activity toaster** — the global, navigation-surviving pill that shows step progress for a perps flow. Sibling of the existing transaction-signing toaster, not the same store.

### Architectural decisions

- **Silent master-key signing model.** All perps actions (L1 + UserSigned) are signed by reusing the existing background `signTypedData_v4` method. No agent key, no `approveAgent` step, no per-user agent store. The web app's `agentKeyStore.ts` and `signWithAgent.ts` are NOT ported. This is the single biggest divergence from the web app's design and the primary simplification we get from controlling private keys in-process. Each perps action will land in the wallet's typed-data activity log; accepted as a tradeoff for not building a separate silent-signing path.
- **Wallet gating.** Perps surfaces are visible only for bare wallets (mnemonic / private-key containers) whose current address is EVM. Hidden for Ledger / hardware wallets, hidden for watch / read-only accounts on their own Overview, hidden for Solana wallets. Watch addresses surfaced via search or portfolio view still render PerpPage / positions / history in read-only mode (no CTAs).
- **No remote feature flag.** Ship always-on once merged. Builder-fee config still fails closed per web spec §14 — if the Firebase builder address or fee is missing at runtime, trade CTAs are hidden.
- **Single PR, single feature branch.** Matches web PR #7's model.
- **i18n waived for v1.** All new copy is inline English. Existing locale files get a single `perps` key addition for the tab label, mirroring web's PR. Full translation pass is a follow-up.

### Code organization

Adapts the web app's split (`src/pages/perps/` + `src/features/hyperliquid/`) to the extension's conventions:

- **UI surfaces** live under `src/ui/pages/Perps/` (per-page subfolders for PerpPage, PerpsTrade, PerpsDeposit, PerpsWithdraw, Blocks, History, Onboarding).
- **Domain logic** lives under `src/modules/hyperliquid/` (existing module; currently only has `fetchHyperliquidBalance.ts`). New subfolders: `actions/`, `signature/`, `api/`, `calc/`, `fees/`, `hooks/`, `useCases/`, plus a top-level `perpsActivityStore.ts`.
- **Global toaster** lives under `src/ui/components/PerpsActivity/` as a sibling of `TransactionSigner/`.
- **Shared visual primitives** that SwapForm2 needs and PerpsDeposit also needs (per the existing `feedback_selector_sharing_strategy` memory) get promoted under `src/ui/components/` rather than copied. The PerpsDeposit page itself is a fork of SwapForm2's orchestration, not a parameterization of SwapForm2.

### Major modules

**New deep modules (testable in isolation):**

1. **Hyperliquid action serialization** — pure functions in `src/modules/hyperliquid/signature/`. Takes hand-written TypeScript action types (matching iOS naming: `ExchangePlaceOrderAction`, `ExchangeUpdateLeverageAction`, etc.) and produces (a) L1Action typed-data with msgpack+keccak256-derived `connectionId`, and (b) UserSignedAction typed-data. Includes hex-to-`{r,s,v}` signature parsing. `@msgpack/msgpack` added as a dependency, dynamic-imported on first use.

2. **Perps math** — pure functions in `src/modules/hyperliquid/calc/` and `src/modules/hyperliquid/fees/`. `calculateLiquidationPrice`, `calculatePositionSize`, `calculatePriceWithSlippage`, `calculateFeeRate`. Ported from iOS verbatim. Hardcoded constants: `MIN_ORDER_NOTIONAL = 10`, `SLIPPAGE = 0.01`.

3. **Perps order flow orchestrator** — `src/modules/hyperliquid/useCases/`. Given an intent (open / add / close / updateLeverage / deposit / withdraw), queries `/info` for current state, decides which preflight substeps to skip, signs each via the existing background `signTypedData_v4`, POSTs to `https://api.hyperliquid.xyz/exchange`. Emits step-progress events into the perps activity store. Handles mid-flow rejection by re-querying `/info` and resuming with state-driven skip.

4. **Perps activity toaster store** — `src/modules/hyperliquid/perpsActivityStore.ts`. Imperative API: `start({ kind, label })`, `advance({ label })`, `succeed({ text })`, `fail(error)`. Subscribed to by the `<PerpsActivityToaster>` component for rendering. Outlives page navigation by living above the route tree (mounted in App.tsx).

**New UI surfaces:**

5. **`SuccessToast` (global)** — root-mounted in App.tsx, fed via `showSuccessToast({ text })`. Uses the native `popover` API (same pattern as the existing `PopoverToast`) but with an animated success-check icon and entry/exit animations matching the TransactionToaster aesthetic. Persists across navigation.

6. **PerpsActivityToaster** — mounted alongside `TransactionToaster` and `SuccessToast`. Reuses the existing toaster pill's visual component / animation system. New `ToasterView` variants for perps flows (`perps-open`, `perps-add`, `perps-close`, `perps-deposit`, `perps-withdraw`). Animated label transitions between preflight substeps.

7. **Overview perps tab integration** — extends `src/ui/pages/Overview/Overview.tsx` with a 4th `<SegmentedControlLink>` ("Perps" + fire icon). Visible only when `isBareWallet && isEvmAddress && !isReadonlyAccount`. Destination conditional on hyperliquid balance: `/overview/perps` when funded, `/perps/deposit` when empty.

8. **Overview perps subroute** — `/overview/perps`. Two stacked sections: open positions list (one row per asset with size, leverage, liq price, PnL) and a tabbed history widget (Trades + Ledger). Both query Hyperliquid `/info`.

9. **PerpPage** — `/perps/:perpId`. Composed of Blocks ported from the web PR: `Heading`, `ChartBlock` (ChartJS only — lightweight-charts renderer + dev-menu override from the web PR are dropped), `StatsBlock`, `PositionBlock` (read-only), `HistoryBlock`, `RiskDisclosureBlock`. Bottom CTAs branch on current position state (mirrors web's right-rail `DefaultView` logic): when flat → "Buy Long" / "Buy Short" linking to `/perps/:perpId/trade?mode=open&side=...`; when open → "Add to Long|Short" / "Close" linking to `/perps/:perpId/trade?mode=add` or `?mode=close`.

10. **PerpsTradePage** — `/perps/:perpId/trade`. Three form modes (open / add / close) selected by `?mode=` URL search param. Two sub-overlays (leverage slider+chips, auto-close TP/SL). USD-only input. Submit triggers the perps order flow orchestrator and the perps activity toaster, then navigates back with `navigate(-1)` immediately while signing continues in the background. On terminal success, `showSuccessToast` fires (Position opened / updated / closed).

11. **PerpsDepositPage** — `/perps/deposit`. Visual primitives forked from `SwapForm2` (per the existing selector-sharing strategy memory). Output side is locked to Hypercore USDC; input side is a regular asset+chain picker over the user's bridgeable positions. Uses existing `useQuotes` infrastructure. On first visit, opens a `Dialog2` (size='full') with the `PerpsOnboarding` carousel above the form. Dismiss flips `publicPreferences.perpsOnboardingDismissed` to `true`.

12. **PerpsWithdrawPage** — `/perps/withdraw`. Single amount input + Max chip + "Available $X" subline. Destination is read-only text: "to <truncated address> on Arbitrum". Min $5. On submit, signs a `withdraw3` UserSignedAction silently and POSTs to `/exchange`.

13. **PerpsOnboarding** — 3-screen swipeable carousel ported from the web PR. Each screen has a CTA: first two are "Next", the last is "Got it" (extension departs from web's empty-space-on-last-slide pattern). Top-right X also dismisses. Both paths flip `perpsOnboardingDismissed = true`.

14. **Search integration** — extends `src/ui/pages/Search/Search.tsx` and the `search-query.ts` response type with a `perps` section. Perp result rows show icon + symbol + mark price + 24h change + a "Perp" pill or fire icon. Click navigates to `/perps/:perpId`.

### Modifications to existing modules

- **`PublicPreferences` interface** (`src/background/Wallet/model/types.ts`) — add `perpsOnboardingDismissed?: boolean`. Migrations not required (optional field).
- **`searchQuery` response type** (`src/modules/zerion-api/requests/search-query.ts`) — add optional `perps?: Perp[]` section, ported from the web app's `Perp` shape.
- **`useWalletPortfolio`** (`src/modules/zerion-api/hooks/useWalletPortfolio.ts`) — already merges hyperliquid balance into total value. No change to this hook; consumers stay as-is.
- **App.tsx** — mount `<SuccessToast />` and `<PerpsActivityToaster />` as siblings of the existing `<TransactionToaster />` mount inside `<TransactionSigner>`.
- **Overview tab strip** (`src/ui/pages/Overview/Overview.tsx`) — add a 4th `<SegmentedControlLink>` for perps, gated on the visibility predicate.
- **Locale files** (`src/i18n/locales/*/common.json`) — add a single `perps` key for the tab label (matches the one-word addition the web PR made across the same languages).

### API contracts

- **Hyperliquid `/info` queries.** Per asset preflight needs `userRole` (dex abstraction), `referral`, `maxBuilderFee`, `userFees`. Per session needs `clearinghouseState`, `userFills`, `userNonFundingLedgerUpdates`. All POST to `https://api.hyperliquid.xyz/info` with `{ type, user }` body. React Query for caching; no localStorage.
- **Hyperliquid `/exchange`** — POST signed actions to `https://api.hyperliquid.xyz/exchange`. JIT verification: refetch `clearinghouseState` and `metaAndAssetCtxs` right before submit; abort if state changed beyond a tolerance.
- **Firebase Remote Config** — three new keys read via existing `useFirebaseConfig`: `hyperliquid_builder_address` (string), `hyperliquid_builder_fee` (uint, basis-points style), `hyperliquid_builder_fee_premium` (uint). Fail closed: if any missing, trade CTAs are hidden. Key names coordinated with iOS team.
- **No testnet.** Hardcode `api.hyperliquid.xyz`, matching iOS and web.

### Interaction details

- **Form submission flow** (trade / deposit / withdraw): click submit → form fires perps activity toaster `start()` → `navigate(-1)` immediately → orchestrator runs preflight + sign + POST in the background, emitting `advance()` per step → on success, `succeed()` + `showSuccessToast()` + invalidate the affected React Query keys. On failure, `fail(error)` puts the toaster into a terminal failed state with a 3s hold then dismiss.
- **Balance refresh keys** — Trade: invalidate `clearinghouseState` + `userFills`. Deposit: invalidate `clearinghouseState` + `walletPortfolio` + `hyperliquidBalance`. Withdraw: invalidate `clearinghouseState` + `walletPortfolio` + `hyperliquidBalance`.
- **Mark price polling** — `usePerpAssetCtx` polls every 5s while the trade form is open; explicit `queryClient.invalidateQueries` right before submit (JIT, per web spec §15).
- **Wallet rejection** — Won't happen in v1 since signing is silent. Reserved as a future concern if we ever expose perps to Ledger / WalletConnect users.
- **Stale URL params** — if the trade page is loaded with `?mode=close` but no open position exists, silently strip all form params via `navigate({ replace: true })`. No toast.

### Schema changes

- `PublicPreferences.perpsOnboardingDismissed?: boolean` — additive, optional, no migration.

### What's NOT being built (in scope of the web PR, dropped here)

- The web PR's `agentKeyStore`, `signWithAgent`, and the `approveAgent` preflight step. Replaced by direct silent master-key signing.
- The web PR's `CandleChartLightweight` renderer, `ChartSettings.tsx`, and the dev-menu chart-renderer override. ChartJS only.
- The web PR's `PerpsDappFrame.tsx` and Explore pages (`src/pages/Explore/pages/Perps/*`). Out of scope per user request.
- SEO files (`/-seo/`). Out of scope per user request.
- Per-provider `signTypedData` plumbing for EIP-6963 / WalletConnect / Ledger. Not needed because we don't sign through external providers.
- The web PR's in-form `SuccessStateLoader` / `TransactionStepper` overlays. Replaced by the global perps activity toaster pill.
- Explicit "Done" button on success. Replaced by auto-navigate-back + success toast.

## Testing Decisions

A good test for this feature tests external behavior at a stable interface, not the implementation details inside it. Tests should be runnable in isolation with `jest` (the extension's existing test runner) and should not require a real Hyperliquid network — all HTTP and signature calls are mocked. Tests should outlive refactors of the internal implementation.

**Modules to be unit-tested in this PR:**

1. **Hyperliquid action serialization** (`src/modules/hyperliquid/signature/`). Test inputs are canonical action objects (placeOrder, updateLeverage, approveBuilderFee, setReferrer, withdraw3). Assert: (a) msgpack output for each action matches iOS fixtures byte-for-byte, (b) L1Action `connectionId` (keccak256 of msgpack) matches iOS fixtures, (c) typed-data structure for both L1Action and UserSignedAction matches Hyperliquid spec, (d) `parseSignature` correctly splits a hex sig into `{r, s, v}`. iOS fixtures to be copied from `Zerion/Screen/Perpetuals/PerpetualOrder/PerpetualOrderUtilsTests.swift` as TS fixtures.

2. **Perps math** (`src/modules/hyperliquid/calc/`, `src/modules/hyperliquid/fees/`). Test inputs: known mark price, position size, leverage, fee rate, slippage. Assert: `calculateLiquidationPrice`, `calculatePositionSize`, `calculatePriceWithSlippage`, `calculateFeeRate` all produce values matching iOS test vectors. Pure-function tests; no mocks needed.

3. **Perps order flow orchestrator** (`src/modules/hyperliquid/useCases/`). Mock the wallet's `signTypedData_v4` (returns a canned hex sig), mock the HTTP client for `/info` and `/exchange`. Assert: (a) for a brand-new user, preflight runs all 4 setup steps before placeOrder, (b) for a returning user whose `/info` says all preflight is done, only placeOrder runs, (c) mid-flow rejection followed by `/info` refetch correctly skips already-done steps, (d) `perpsActivityStore` receives the expected `start` / `advance` / `succeed` / `fail` calls in order. Prior art: `src/background/transactions/TransactionPoller.ts` testing pattern (mocked HTTP + assertions on emitted events).

4. **Perps activity toaster store** (`perpsActivityStore.ts`). Test the store's state transitions directly: `start()` makes it visible, `advance()` updates current label, `succeed()` enters terminal success state with auto-dismiss timer, `fail()` enters terminal failed state with 3s hold. Prior art: the extension currently has no test for the analogous `TransactionSigner/store.ts` — this would set the precedent.

**Not unit-tested in this PR:**

- React UI components (PerpPage, PerpsTradePage, PerpsDepositPage, etc.). Tested manually before merge.
- Routing changes. Tested manually.
- Search integration. Tested manually.

**Manual QA before merge:**

- Place a small real-USDC trade through each form (open, add, close) on a staging build. Flagged in PR description.
- Deposit a small amount from Arbitrum, observe the funds settle, then withdraw it back.
- Verify onboarding dialog appears on first deposit visit and not on second.
- Verify toast shows correct text and navigates back to correct origin for each of the 5 actions.
- Verify perps tab visibility / gating across wallet types: bare EVM (visible), bare Solana (hidden), Ledger (hidden), watch (hidden on own overview, visible read-only when found via search).
- Verify search results render perps section and clicking navigates correctly.

**No integration tests against real Hyperliquid** — there's no testnet and placing orders in CI is unsafe.

## Out of Scope

- **Explore pages.** The web PR introduced `/explore/perps` listing all available perp markets with a verified-only toggle, etc. (256 LOC `PerpsExplorePage.tsx`, 163 LOC `PerpSectionCard.tsx`, 97 LOC `PerpRow.tsx`, 117 LOC `selectPerps.ts`, plus a skeleton). All deliberately dropped — extension users discover perps via the Overview tab CTA, by clicking the perps balance banner, or via search.
- **SEO infrastructure.** Extension is not crawled.
- **Delegation / agent-key trading on behalf of another account.** Out by design — silent master-key signing replaces it.
- **Hardware wallet support (Ledger).** Excluded by the wallet-gating predicate.
- **WalletConnect / EIP-6963 / external provider signing paths for perps.** Not needed — perps signs only via the in-extension master key.
- **Solana wallets.** Hidden from perps surfaces entirely.
- **Testnet mode.** Hyperliquid has no testnet; we hardcode mainnet endpoints.
- **Per-action analytics.** Defer to a follow-up.
- **Translations.** New copy is inline English; locale files get only the one-word `perps` tab key. Full translation is a follow-up PR.
- **Optimistic position updates.** Async-settlement messaging is honest; deferring optimistic state to a follow-up.
- **Withdraw to a different address.** Locked to the current wallet's address on Arbitrum.
- **Dev-menu chart-renderer override.** ChartJS only; no toggle.
- **CandleChartLightweight renderer.** Dropped.
- **First-trade risk-disclosure modal.** Rely on the existing inline `RiskDisclosureBlock` on PerpPage.

## Further Notes

### Open items to resolve during implementation

These are inherited from the web spec's open items and still apply:

- **Firebase config key names** — coordinate with iOS team on canonical names for `hyperliquid_builder_address`, `hyperliquid_builder_fee`, `hyperliquid_builder_fee_premium`. iOS may already have these in their Preferences payload under different names.
- **Premium-detection hook** — locate the extension's equivalent of iOS `account.isPremium` so we know whether to apply the premium builder fee.
- **`dexIndex` source** — extend `findPerpAsset` (or sibling) to expose `dexIndex` for the order payload's `a` field on builder-deployed perps (`a = 100_000 + dexIndex × 10_000 + index`).
- **iOS test vectors** — copy msgpack/keccak/liquidation-price test fixtures from iOS Swift tests as TypeScript fixtures.
- **`existingTypedDataSigned` activity-history pollution** — confirm that the perps preflight signatures landing in the extension's typed-data activity log is acceptable UX. If noisy in practice, follow up by adding a `skipActivityLog` parameter to `signTypedData_v4`.

### Memory references

The following existing user-memory entries shaped this PRD and should be respected by the implementation:

- `feedback_selector_sharing_strategy` — promote shared visual primitives to `src/ui/components/`, fork orchestrating dialogs/pages per feature. Drives the PerpsDeposit-vs-SwapForm2 relationship.
- `feedback_warning_banners_no_animation` — hard mount/unmount over height/fade tweens in vertical form columns. Applies to any warning state in the trade form.

### Reference codebases

- **Web PR #7** (`feature/perps-page` branch in `zerion-web-app`): the design spec is at `.claude/plans/perps-trading-design.md` and the full implementation is in the diff.
- **iOS**: `zerion-ios/Zerion/Screen/Perpetuals/`, `DomainLayer/DomainLayer/Facades/HyperliquidExchange/`, `DomainLayer/DomainLayer/Facades/HyperliquidInfo/`. Source of truth for math formulas, action types, and test fixtures.

### Implementation order suggestion

A reasonable layering for splitting the work across commits even within the single PR:

1. **Foundation** — `PublicPreferences.perpsOnboardingDismissed` field, `search-query.ts` `perps` section, scaffold new directories.
2. **Math + serialization + tests** — pure modules with iOS-fixture-backed unit tests. No UI yet.
3. **Hyperliquid `/info` and `/exchange` clients + hooks** — React Query hooks for `clearinghouseState`, `userFills`, `userFees`, etc.
4. **Perps activity store + toaster pill + SuccessToast** — root-mounted infrastructure. Manually triggerable from a test page.
5. **Order flow orchestrator + tests** — wires the pieces together; mock-tested in isolation.
6. **Read-only surfaces** — PerpPage (chart/stats/position/history), `/overview/perps`, search perps rendering. No CTAs yet.
7. **Onboarding + PerpsDeposit + PerpsWithdraw** — the deposit/withdraw flows end-to-end.
8. **PerpsTradePage** — the three form modes + sub-overlays.
9. **Overview tab integration** — fourth segment, gating predicates, balance banner relink.
10. **Manual QA pass** — staging build, real small trades, full happy-path walkthrough.

Each step is reviewable in isolation in the diff even though they ship together.
