# PRD: Intent-based swaps (swap API v3) in the extension

Status: implemented on branch (2026-09-07), pending QA (§11 step 9) · Owner: zerts · Ticket: WLT-2447 · Branch: `extension-intent-based-swaps-wlt-2447` Related: [ADR-0004](../adr/0004-orders-in-transactions-store-polled-by-background.md), [CONTEXT.md → "Swaps: intent execution"](../../CONTEXT.md), web-app reference PR [zerion-web-app#93](https://github.com/zeriontech/zerion-web-app/pull/93) (branch `web-intent-based-swaps-wlt-2442`, PRD at `docs/prd/intent-swaps.md`, ADR-0005), backend reference gist `sobolev-igor/467861e697405f1cca4519bd2bfab831`.

Every decision below was made in a grilling session on 2026-09-07 and is final unless this document is amended. Terms in **bold** are defined in CONTEXT.md.

## 1. Overview

Swap API v3 (`transaction/stream-swap-quotes/v3`) returns the v2 quote plus `intentSwap`, `intentApprove`, `quoteId`. A quote with a non-null `intentSwap` is an **Intent Swap**: the user signs an off-chain payload, the extension posts the signature(s) to `transaction/execute-order/v1`, and settlement is observed through `transaction/get-order-status/v1` by an opaque **Order** id. A quote with `intentSwap: null` is an **On-chain Swap** and executes exactly as today.

Both execution modes are first-class production paths. Nothing may assume a quote is intent-based; every branch keys off the quote's own fields.

For the user the two flows look the same: the same form, the same quote list, the same one- or two-step toaster, the same pending row in History. The only visible differences are a small signature marker on intent quotes in the quote list, that a permit approval does not wait for a block, that the HardwareDialog shows a "Refreshing quote" step status after a mined on-chain approval (the toaster stays on "Swapping"), and that the swap waits for provider settlement instead of a mined hash.

Unlike the web app, the extension signs in its own background and has no external wallet to hand off to. The popup can also close at any time, so the Order's lifecycle is owned by the background service worker (ADR-0004).

## 2. Hard constraints, Goals / Non-goals

**Hard constraint — On-chain Swaps stay in production.** Intent Swaps are added next to, not instead of, On-chain Swaps. Product keeps serving both from the same v3 stream. Therefore:

- No code path may be removed, short-circuited or gated on the assumption that a quote is intent-based. The `send` swap step, hash tracking, nonce handling, gas configuration, receipt polling and nonce purge stay exactly as they are and remain covered by tests.
- Every branch keys off the quote's own fields (`transactionSwap`, `intentSwap`, `transactionApprove`, `intentApprove`), never off the API version or a feature flag.
- The quote list, default selection and sign button treat both kinds through `isExecutableQuote`; an On-chain quote is never ranked below or hidden behind an Intent quote by the client.
- Acceptance requires the On-chain path to behave byte-for-byte as before (§12).

**Goals**

- Both quote consumers (SwapForm2, PerpsDeposit) read v3 and execute **both** On-chain Swap and Intent Swap quotes on EVM and Solana, for software wallets and Ledger.
- One shared step builder so the approve/re-quote/sign/submit logic exists once.
- A placed Order is tracked like a pending transaction: in History immediately, polled by the background, surviving popup close and service-worker restart.
- The toaster and HardwareDialog reflect the re-quote and order-pending phases.
- No visual change to the quote list or quote details.

**Non-goals (explicitly deferred)**

- Automatic re-sign after `execute-order` rejects a stale quote.
- A "Gasless" badge or any quote-list decoration.
- A runtime v2/v3 switch. v3 is a superset; rollback is a normal release.
- A post-swap success screen (the extension has none; the toaster and History are the feedback surfaces).
- Accepting an on-chain quote as the result of a **Re-quote** (see §5.3; web-app parity chosen).

## 3. API contract

### 3.1 `GET transaction/stream-swap-quotes/v3` (SSE)

Same request as v2 (`createSwapQuotesV2Url` in `src/ui/shared/requests/useQuotes.ts`: `currency`, `inputChain`, `outputChain`, `from`, `to`, `inputFungibleId`, `outputFungibleId`, `inputAmount`, `slippage`). Same events (`update` with `Quote2[]`, `end`, `error`). Headers via `createHeaders({})` (`X-Request-Id`, `Zerion-Client-Type: web-extension`, `Zerion-Client-Version`). `Quote2` gains:

| field | type | meaning |
| --- | --- | --- |
| `quoteId` | `string` | Opaque id for `execute-order`. May be `""` on a quote carrying `error`. Changes on every stream update. |
| `intentSwap` | `null \| { evm: TypedDataDocument \| null; solana: string \| null }` | Present ⇒ Intent Swap. `evm` is EIP-712 (`types` without `EIP712Domain`, `primaryType`, `domain`, `message` — `message` may arrive as a JSON string). `solana` is a base64 serialized transaction to sign without broadcasting. |
| `intentApprove` | `null \| { evm: TypedDataDocument \| null; solana: null }` | **Permit Approval** to sign. Mutually exclusive with `transactionApprove`. |

Rules:

- **Executable Quote** ⇔ `error == null && (transactionSwap != null || (intentSwap != null && quoteId !== ''))`. Add `isIntentQuote()` and `isExecutableQuote()` to `src/shared/types/Quote.ts`. `SwapButton.isDisabled`, the `invariant(quote.transactionSwap)` in both mutation bodies, and `useSwapQuote`'s default selection use these instead of `transactionSwap`.
- Exactly one of `transactionApprove` / `intentApprove` is set, or neither. `transactionApprove` is EVM-only (existing invariant stays).
- Provider identity stays `contractMetadata.id` (selection, SSE merge, `selectedQuote` analytics, re-quote match). `quoteId` is per-quote.

### 3.2 `POST transaction/execute-order/v1`

Body `{ quoteId, signatureSwap, signatureApprove? }` → `{ data: { orderId } }`.

| the quote carried | `signatureSwap` |
| --- | --- |
| `intentSwap.evm` | EIP-712 signature, `0x` hex |
| `intentSwap.solana` | signed transaction, **base64** (`SolSignTransactionResult.tx`) |

`signatureApprove` = the permit's EIP-712 signature; **omit the key entirely** when there is none (`""` is a 400). `orderId` is opaque (`"<provider>:<opaque>"`, or `"solana:<signature>"` for Jupiter Ultra) and is never derived from `quoteId`.

Errors: `400` = our request (stale/unknown `quoteId`, bad signature) → "quote expired" failure in the form; `422` unsupported chain, `500` backend → generic failure. No automatic retry of any class. Log the response body to `client_error` analytics so bad-signature and expiry can be told apart.

### 3.3 `GET transaction/get-order-status/v1?orderId=`

→ `{ data: { status: 'pending' | 'successful' | 'failed' | 'rejected', fills: Array<{ chain: string; hash: string }> } }`. `pending` is the only non-terminal status. `fills` is empty until settled; multi-step routes may have several.

### 3.4 Signing facts (verified against the codebase)

- `src/modules/ethereum/message-signing/signTypedData.ts` is ethers-based: `prepareTypedData` already strips `EIP712Domain` and `removeUnusedTypes` prunes the rest; ethers derives the domain type. **No `EIP712Domain` injection helper is needed** (the web app needed one for `eth_signTypedData_v4` wallets). `toTypedData` parses a string document, but a string `message` inside an object document must be parsed by us before signing; `domain.chainId` may arrive as a string (ethers coerces).
- No chain switch is needed before signing typed data: the offline signer is chain-agnostic.
- `Wallet.solana_signTransaction({ silent: true })` signs without broadcasting and without emitting `transactionSent`; it returns `{ signature, publicKey, tx: base64 }`.
- Ledger: `HardwareSignMessage` already exposes `signTypedData_v4` over the iframe (`hardwareMessageHandler.request({ method: 'signTypedData_v4', params: { derivationPath, typedData } })`), and `HardwareSignTransaction.signSolanaTransaction` signs a Solana tx without sending. Both are reachable from `TransactionSigner.tsx` via `getLedgerIframeController()`.

## 4. Architecture

```
popup (UI)                                   background (service worker)
──────────────────────────────────────────   ─────────────────────────────────────────────
SwapForm2 / PerpsDeposit                     Wallet.signSwapIntent      (software only)
  └ buildSwapSteps(quote, …) → SignStep[]    Wallet.submitSwapOrder     (software + Ledger)
TransactionSigner queue                        ├ ZerionAPI.transactionExecuteOrder
  ├ send step   (as today)                     ├ transactionsStore.push(order arm)
  └ order step                                 ├ emitter.emit('orderPlaced')
      ├ requote (own SSE)                      └ OrdersPoller.add(orderId)
      ├ sign permit / intent  ─walletPort─►  OrdersPoller
      ├ submitSwapOrder       ─walletPort─►    ├ ZerionAPI.transactionGetOrderStatus
      └ waitForOrderResolve(orderId)           ├ on terminal: settle entry, write fill hash,
          (reads localTransactionsStore)       │   transactionCollect(each fill)
TransactionToaster / HardwareDialog            └ backoff 3 s → 15 s after 2 min
  (queue events incl. new phases)
History / ActionInfo (unchanged read path)   analytics.background: orderPlaced → signed_transaction
```

### 4.1 Background

**`Wallet.signSwapIntent`** (`src/background/Wallet/Wallet.ts`, internal-origin only, `verifyInternalOrigin`):

```ts
signSwapIntent({ params: { intent: { evm: TypedDataDocument | null; solana: StringBase64 | null } } }): Promise<string>
```

- `evm`: parse a string `message`, then `signTypedData(document, this.getOfflineSigner())`. Returns hex. Emits **no** `typedDataSigned` (that event is `signed_message` analytics for dapp/message flows).
- `solana`: `SolanaSigning.signTransaction` with the current address's keypair, returns `result.tx` (base64). Emits nothing.
- Throws for a readonly/device wallet (`getOfflineSigner` already does); the UI never calls it for device accounts.

**`Wallet.submitSwapOrder`**:

```ts
submitSwapOrder({ params: {
  quoteId: string;
  signatureSwap: string;
  signatureApprove?: string;      // omitted, never ""
  orderContext: TransactionContextParams & { quote: Quote2; outputChain: string | null };
  order: { from: string; inputChain: string; outputChain: string; explorerUrlTemplate: string | null };
} }): Promise<{ orderId: string }>
```

1. `ZerionAPI.transactionExecuteOrder(body)` (`retry: 0`). HTTP errors propagate to the UI unchanged (ky `HTTPError`) so the form can classify 400.
2. `transactionService.addOrder(...)`: push an **order arm** `TransactionObject` (§4.2) with `addressAction = orderContext.addressAction`, `initiator`, `timestamp`; add to the orders poller; `startPurgeInterval()` as `transactionSent` does.
3. `emitter.emit('orderPlaced', { orderId, quoteId }, { mode, ...orderContext })` — same context shape as `transactionSent` so analytics reuses `trackTransactionSign`.
4. Return `{ orderId }`.

**Orders poller** (`src/background/transactions/OrdersPoller.ts`, sibling of `TransactionsPoller`, owned by `TransactionService`):

- `add(orderIds)`, restarted from the store on `initialize()` for every pending order arm.
- Interval 3 s per order while pending, backing off to 15 s once the entry is older than 2 min. Requests via `ZerionAPI.transactionGetOrderStatus` (background client). Uses `RequestCache` like the receipt poller to dedupe.
- Emits `order:settled(orderId, { status, fills })`. Query errors are tolerated (keep polling); 5 consecutive 4xx → emit `order:settled` with `status: 'failed'`, `fills: []` (unknown to the backend, will never settle).
- `TransactionService` handler on `order:settled`: `orderStatus = status`, `fills = fills`, `hash = fills[0]?.hash ?? undefined` (for display only), patch `addressAction.transaction.hash` and `explorerUrl` (template `contractMetadata.explorer.txUrl` or the input network's explorer, `{HASH}` replaced), and `transactionCollect({ hash, chain })` for every fill (fire-and-forget, errors swallowed). Never adds the fill to `TransactionsPoller`.

### 4.2 Store shape (ADR-0004)

`src/modules/ethereum/transactions/types.ts`:

```ts
type OrderObject = {
  orderId: string;
  orderStatus: 'pending' | 'successful' | 'failed' | 'rejected';
  fills: Array<{ chain: string; hash: string }>;
  /** Signer address; used by filterAddressTransactions */
  from: string;
  /** Input network id (NetworkId), for chain filters */
  chain: string;
  /** fills[0].hash once settled — display only, never polled */
  hash?: string;
};
export type TransactionObject = CombineUnion3<
  EvmObject,
  SolanaObject,
  OrderObject
> & { timestamp; initiator; dropped?; addressAction? };
```

Touch points that must learn the third arm (each currently assumes hash|signature):

| file | change |
| --- | --- |
| `TransactionService.ts` `TransactionsStore.upsertTransaction` / `bulkDeleteTransactionsById` | key `x.hash ?? x.signature ?? x.orderId` |
| `TransactionService.ts` `toPollingObj` | not called for order arms (guard by `orderId`) |
| `TransactionService.ts` `performPurgeCheck` | `if (!item.transaction) continue;` instead of `return` (also fixes Solana entries aborting the loop) |
| `TransactionService.ts` `purgeEntries` | already filters `item.hash && item.transaction`; make it `item.transaction` |
| `getTransactionObjectStatus.ts` | `orderId` branch: `successful → confirmed`, `failed \| rejected → failed`, `pending → pending`; `dropped` never applies |
| `model.ts` `isPendingTransaction` | works via the status helper |
| `filterAddressTransactions.ts` | `txFromRaw = tx.transaction ? tx.transaction.from : tx.publicKey ?? tx.from` |
| `useLocalAddressTransactions.ts` | unchanged (`relatedTransactionHash` undefined on orders) |
| `addressAction/creators.ts` `pendingTransactionToAddressAction` | `orderId` branch → `pendingOrderToAddressAction`: returns the stored `addressAction` with `status` from the order, `transaction.hash` = fill hash or `ZERO_HASH`, `rawTransaction.hash` = `orderId`, `nonce: -1` |
| `useLocalTransactionStatus.ts` | `useTransactionStatus(id)` / `waitForTransactionResolve(id)` also match `tx.orderId === id`; add `waitForOrderResolve(orderId, timeoutMs)` returning `'confirmed' \| 'failed' \| 'timeout'` |
| `ActionInfo.tsx` | `useActionStatusByHash` receives `rawTransaction.hash` (= orderId) for local order actions so status resolves before a fill exists |

Retention: orders have no nonce, so they age out on the existing time-based retention like Solana entries. Store key `transactions` unchanged; the arm is additive, no migration.

### 4.3 UI: signing queue

`src/ui/components/TransactionSigner/types.ts`:

```ts
export type OrderStepParams = TransactionContextParams & {
  quote: Quote2;                       // Executable intent quote at enqueue time
  outputChain: string | null;
  /** Present iff step 0 was an on-chain approve: re-quote before signing */
  requote: null | {
    address: string; currency: string;
    formState: SwapFormState;          // exact params used for the original stream
    providerId: string;                // quote.contractMetadata.id
  };
  order: { from: string; inputChain: string; outputChain: string; explorerUrlTemplate: string | null };
};

export type SignStep =
  | { kind: 'send'; params: SendTxParams; toaster?: ToasterView }
  | { kind: 'signAll'; params: SignAllTransactionsParams; toaster?: ToasterView }
  | { kind: 'order'; params: OrderStepParams; toaster?: ToasterView };

export type QueueEvent =
  | … existing …
  | { type: 'step-requoting'; index: number }
  | { type: 'step-order-pending'; index: number; orderId: string }
  | { type: 'step-still-processing'; index: number; orderId: string };

export type SignTransactionResult = OneOf<{ evm; solana; order: { orderId: string; status: 'confirmed' | 'timeout' } }>;
```

`runStep` for `kind: 'order'` (`TransactionSigner.tsx`; pure orchestration extracted to `runOrderStep.ts` with injected deps for unit tests, following `src/modules/hyperliquid/useCases/runIntent.ts`):

1. `quote = step.params.quote`.
2. If `params.requote`: emit `step-requoting` → `quote = await requoteIntent(params.requote)` (§5.3). Failure → throw `RequoteError` (a `QueueError` cause; toaster shows failed).
3. Emit `step-signing`. `signatureApprove = quote.intentApprove?.evm ? await signIntent({ evm })` : undefined. Then `signatureSwap = await signIntent(quote.intentSwap)`. `signIntent` is `walletPort.request('signSwapIntent', …)` for software, or the Ledger iframe (`signTypedData_v4` / `signSolanaTransaction` → base64) for `isDeviceAccount(queue.options.wallet)`. Ledger denial → `isAbortLikeError` → `queue-aborted`.
4. `{ orderId } = await walletPort.request('submitSwapOrder', { quoteId: quote.quoteId, signatureSwap, signatureApprove, orderContext, order })`. Errors propagate (form classifies).
5. Emit `step-order-pending { orderId }`.
6. `status = await waitForOrderResolve(orderId, ORDER_WAIT_MS = 5 min)`. `'failed'` → throw `OrderFailedError(orderId, orderStatus)` (step-error → toaster "Swap failed"). `'timeout'` → emit `step-still-processing` and resolve `{ order: { orderId, status: 'timeout' } }` (step-success with neutral terminal). `'confirmed'` → resolve `{ order: { orderId, status: 'confirmed' } }`.

`isStepStale` / `refreshStaleGasForStep` apply to `send` steps only. The readonly pre-flight and abort semantics are unchanged.

### 4.4 UI: shared step builder

`src/ui/shared/forms/trading/buildSwapSteps.ts` (new), extracted from the two duplicated mutation bodies (`SwapForm2.tsx:384–630`, `PerpsDeposit.tsx:~240–380`):

```ts
buildSwapSteps({
  quote, configuredQuote,          // configuredQuote = applyTransactionConfiguration(quote, …)
  wallet, address, formState, currency,
  inputPosition, outputPosition, inputNetwork, outputNetwork,
  spendAmount, interpretationAction, userNonce,
  clientScope: 'Swap' | 'Bridge' | 'Perps', actionType, warningWasShown, outputAmountColor,
  toaster: { approve: ToasterView; swap: ToasterView },
}): SignStep[]
```

- Step 0 (optional): `send` approve exactly as today (nonce handling, `createApproveAddressAction2` fallback, `toaster` selection rule incl. the Ethereum/device special case).
- Then either `send` swap (on-chain, unchanged) or `order` (intent) with `requote` set iff an approve step exists, `addressAction = interpretationAction ?? fallbackTradeOrBridgeAction` (built with `hash: null`, `transaction` = a placeholder since the factories require one — extend `createTradeAddressAction2`/`createBridgeAddressAction2` to accept `transaction: MultichainTransaction | null`), `quote`, `outputChain`, `feeValueCommon: quote.networkFee?.amount?.quantity || '0'`.
- `explorerUrlTemplate = quote.contractMetadata.explorer?.txUrl ?? inputNetwork.explorer_tx_url ?? null`.

Both forms keep their own `useMutation` wrapper (form reset, cache invalidation) but call `buildSwapSteps`.

## 5. Execution rules

### 5.1 Approve

- `transactionApprove` → `send` step, wait mined (as today).
- `intentApprove.evm` → signed inside the order step, no separate step, no pending wait.
- Neither → skip.

### 5.2 Sign + submit

Per §4.3. `signatureApprove` is included in the body only when defined.

### 5.3 Re-quote (only after a mined on-chain approve)

`src/ui/shared/requests/requoteIntent.ts` (new, no React): opens `new EventSourceStore<Quote2[]>(createSwapQuotesV3Url(params), { headers: createHeaders({}), eventCodeToMessage })` and inspects every `value` update:

- **Usable**: `quote.contractMetadata.id === providerId && isIntentQuote(quote) && !quote.transactionApprove && !quote.error`.
- Not usable (record the reason for the error message): provider missing from the stream; quote carries `error`; still asks for `transactionApprove` (allowance check lagging); came back as an On-chain Swap (web-app parity: **keep waiting**, do not send it).
- When the stream ends or errors without a usable quote, close it and reopen after `REQUOTE_RETRY_INTERVAL_MS = 2000`, at most `MAX_REQUOTE_ATTEMPTS = 5` streams, all under `REQUOTE_TIMEOUT_MS = 30_000`. On exhaustion throw `RequoteError('quote-refresh-timeout' | 'quote-refresh-failed', lastReason)`.
- If the fresh quote carries `intentApprove`, sign it (replaces any earlier permit).
- The step's `quote`, `quoteId`, `addressAction.receiveAmount` and analytics context switch to the fresh quote.

### 5.4 Failure classification

| failure | where | copy |
| --- | --- | --- |
| user rejected a signature (software cancel, Ledger denied) | form: silent (`QueueAbortError`) | — |
| `signSwapIntent` / iframe error | form error | error message |
| `execute-order` 400 | form error, refetch quotes on dismiss | "The quote expired before the order was placed. Try again." |
| `execute-order` 422 / 5xx / network | form error | "Couldn't place the order. Try again." |
| re-quote timeout / stream failure (always after approve broadcast, so after form reset) | toaster "Swap failed" | subtitle unchanged |
| order `rejected` / `failed` | toaster "Swap failed" | subtitle unchanged |
| order still pending after 5 min | toaster "Still processing" (neutral), History keeps pending | — |

Approve-step failures are unchanged.

## 6. Form behaviour (SwapForm2 and PerpsDeposit)

- "Sent" moment = `step-pending` at index 0 (approve broadcast, as today) **or** `step-order-pending` at index 0 (order placed with no approve). On it: `setUserFormState(resetAfterBroadcast)` / `{ inputAmount: '' }`, resolve the mutation.
- Anything rejecting at index 0 before that rejects the mutation (`step-error`, `queue-aborted`, `queuePromise` pre-flight). `QueueError.cause` for an `HTTPError` with status 400 maps to the quote-expired copy; the existing error display in SwapForm2 renders it; `quotesQuery.refetch()` on dismiss.
- `getQueues().length > 1` early-resolve rule unchanged.
- PerpsDeposit `onSuccess` invalidations unchanged; a deposit that placed an Order continues once the order confirms exactly as it does for a mined swap today (it only reacts to the broadcast moment, so no change).

## 7. Simulation ("Verifying transaction")

`SwapButton.useSwapButton` today simulates `[approve?, swap?]` via `interpretTxBasedOnEligibility`. For an intent quote:

- `transactions` = `[configuredQuote.transactionApprove]` if present (unchanged handling).
- Additionally, for `intentSwap.evm`, call `ZerionAPI.walletSimulateSignature({ address, currency, domain: 'https://app.zerion.io', chain: formState.inputChain, signature: { typedData: preparedDocument } })` (`SimulationResult` already admits `SignatureInterpretResponse`). Merge: warnings from both; the interpreted action from the signature simulation is the pending `addressAction` when non-null.
- Solana intents: no simulation; `simulated = true` immediately with the local fallback action.
- `resolveTransactionWarning`: a null interpreted action for an intent quote does **not** trigger the Unverified state by itself; the output-mismatch check runs only when the signature interpretation returns a matching incoming transfer.

## 8. Toaster and HardwareDialog

`useToasterSession` / `useHardwareDialogSession` consume the new events:

| event | toaster title | HardwareDialog |
| --- | --- | --- |
| `step-requoting` | no change: "Swapping", subtitle from→to, loader running | step status `pending`, title "Refreshing quote" |
| `step-signing` (order step) | "Swapping" / "Bridging" (permit and intent signatures are indistinguishable to the user) | "Confirm in Wallet" / "Sign on Device" |
| `step-order-pending` | "Swapping" / "Bridging" | step status `pending`, "Swapping" |
| `step-still-processing` → `step-success` | new `TerminalKind = 'processing'`: title "Still processing", subtitle "Track it in History", neutral badge, same 3 s hold + dissolve | terminal `success` variant with "Still processing" title |
| `step-error` (`OrderFailedError`, `RequoteError`) | "Swap failed" / "Bridge failed" (existing) | "Failed" (existing) |

`ToasterStatusBadge` gets a neutral variant (clock/dots) for `processing`. `x of n` counting is untouched: the order step is one slot.

## 9. Quote gating and details

- Default quote and sign button: `isExecutableQuote`.
- Network fee dialog opens only when an EVM tx exists (`transactionSwap ?? transactionApprove`), already the case; with approve+intent it configures the approve only. `applyTransactionConfiguration` must pass through when `transactionSwap` is null (verify; add a test).
- `formatNetworkFee` already renders `networkFee.free` as "Free".
- Readonly wallets are blocked by the queue pre-flight as today.

## 10. Analytics

- `transactionFormed`: unchanged.
- On-chain approve `transactionSent`: unchanged.
- New background event `orderPlaced: (result: { orderId; quoteId }, context: { mode } & TransactionContextParams)`. `analytics.background.ts` routes it into `trackTransactionSign({ status: 'success', order: result, context })`: `hash` omitted, `wallet_address` = `addressAction.address` / signer, plus `order_id`, `quote_id`, `execution_type: 'intent'`. Add `execution_type: 'transaction'` to the `transactionSent` path.
- Failures: `transactionFailed(errorMessage, context)` emitted by the background from `submitSwapOrder` on HTTP error and by `TransactionService` on terminal `rejected`/`failed` (`"order rejected"` / `"order failed"`), and by the UI (via `walletPort`) for re-quote failures.
- `signSwapIntent` emits no `signed_message`.
- `selectedQuote` keeps passing `contractMetadata.id`.

## 11. Implementation map (each step type-checks and can ship alone)

1. **Types + v3** — `src/shared/types/Quote.ts`: `quoteId`, `intentSwap`, `intentApprove`, `TypedDataDocument`, `isIntentQuote`, `isExecutableQuote`. `useQuotes.ts`: `createSwapQuotesV3Url`, `/v2` → `/v3` in `useQuotesV2` (rename later). Replace `invariant(quote.transactionSwap)` / `isDisabled` gating.
2. **ZPI requests** — `src/modules/zerion-api/requests/transaction-execute-order.ts`, `transaction-get-order-status.ts` (+ `isTerminalOrderStatus`), registered in `zerion-api-bare.ts`.
3. **Store arm** — `types.ts` `OrderObject`, `getTransactionObjectStatus`, `filterAddressTransactions`, `creators.ts` `pendingOrderToAddressAction`, `useLocalTransactionStatus` (`waitForOrderResolve`), `TransactionService` key/purge fixes. Unit tests for status mapping and purge skip.
4. **Background** — `OrdersPoller.ts`; `TransactionService.addOrder` / `order:settled` handler / restart on `initialize`; `Wallet.signSwapIntent`, `Wallet.submitSwapOrder`; `events.ts` `orderPlaced`; analytics routing.
5. **Queue** — `types.ts` new step/events/result; `runOrderStep.ts` with injected deps + tests (permit+intent, approve+requote+intent, requote timeout, execute-order 400, order rejected, order timeout, Ledger denial, Solana intent); `requoteIntent.ts` + tests (usable/unusable reasons, retry cadence, bound); `TransactionSigner.tsx` dispatch incl. hardware branch.
6. **Toaster / HardwareDialog** — new phases, `processing` terminal, badge variant, ui-lab previews updated.
7. **Forms** — `buildSwapSteps.ts`; SwapForm2 and PerpsDeposit mutations rewritten on top of it; sent-moment and error classification; `createTradeAddressAction2`/`createBridgeAddressAction2` accept a null transaction.
8. **Simulation** — SwapButton signature simulation for EVM intents; `resolveTransactionWarning` rule + test.
9. **QA** — software wallet on Base (0x Gasless permit path, on-chain approve → re-quote (toaster stays "Swapping") → order), Solana (Jupiter Ultra), Ledger EVM + Solana via HardwareDialog, popup closed during order-pending (reopen: History pending → confirmed on its own), on-chain quote byte-for-byte unchanged, PerpsDeposit with an intent quote. Existing jest baseline: two flaky/failing suites on clean main are pre-existing (see memory).

## 12. Acceptance criteria

- A v3 intent quote on EVM completes for a software wallet: permit (if any) and intent are signed in the background, `execute-order` returns an order id, History shows the pending trade immediately, the toaster ends in "Swapped" once `get-order-status` is terminal, ActionInfo links to `fills[0]`.
- With an on-chain `transactionApprove`, the flow waits for the mined approval, re-quotes (HardwareDialog shows "Refreshing quote"), and signs the **fresh** quote's intent; the payload uses the fresh `quoteId`. A fresh on-chain quote is not accepted; the wait continues until the 30 s bound.
- Solana intent quotes complete via sign-without-send; `signatureSwap` is base64.
- Ledger completes both EVM and Solana intents through HardwareDialog with the same phases.
- `intentSwap: null` quotes behave byte-for-byte as before (approve tx, swap tx, hash tracking, nonce handling).
- `execute-order` 400 shows the quote-expired error in the form and refetches quotes; `rejected` and `failed` orders end the toaster in "Swap failed"; a 5-minute pending order ends it in "Still processing".
- Closing the popup or restarting the service worker while an order is pending keeps polling; the History entry flips to confirmed/failed on its own; fills are sent to `transaction/collect`.
- PerpsDeposit executes an intent quote and proceeds on order placed.
- Analytics: `signed_transaction` fires for intents with `order_id`, `quote_id`, `execution_type`; no `signed_message` for permit/intent signatures.
- `npm run typecheck`, lint and jest are clean (modulo the pre-existing baseline).

## 13. Risks

- **Re-quote window**: the provider may keep asking for an approval for several streams (allowance check lagging the mined tx) or vanish; the 30 s / 5-stream bound surfaces this as a failed swap rather than a hang. The approval is on-chain and reusable, so a retry costs nothing extra.
- **Address-action factories require a transaction** today; making it nullable touches `createTradeAddressAction2` / `createBridgeAddressAction2` consumers (`rawTransaction`, `ActionInfo`).
- **Hash-less store entries**: several helpers `throw`/`return` on the unexpected shape; every touch point in §4.2 must be covered by a unit test to avoid a broken History page.
- **Service-worker restarts**: the orders poller must be rebuilt from the persisted store on `initialize()`; a `submitSwapOrder` that succeeded at the backend but died before persisting would orphan an order (accepted: the backend still indexes the fill).
- **Bad signature vs expiry** both come back as 400; the response body must reach `client_error` analytics.
