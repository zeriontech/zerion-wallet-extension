# Intent Orders get no local History row

Supersedes the unmerged ADR-0004 of the Intent based swaps branch ([zeriontech/zerion-wallet-extension#980](https://github.com/zeriontech/zerion-wallet-extension/pull/980)), which stored Orders in the background transactions store and polled them from an `OrdersPoller`.

An **Intent Swap** ends with an **Order**: `transaction/execute-order/v1` returns an `orderId`, and the provider settles it on-chain later. There is no transaction hash when the Order is placed, so it does not fit the local transactions store, which is keyed by hash or Solana signature and polled by `TransactionsPoller` against an RPC.

Decision (lead's rule, [WLT-2763](https://linear.app/zerion/issue/WLT-2763) / [WLT-2766](https://linear.app/zerion/issue/WLT-2766)): placing an Order creates **no** local History row.

- The Order step (`src/ui/components/TransactionSigner/runOrderStep.ts`) signs and calls execute-order, and nothing else: no `signAndSendTransaction`, no `transactionSent`, no write to the local transactions store.
- History shows the Order from the backend's pending actions list ([WLT-3100](https://linear.app/zerion/issue/WLT-3100)), deduplicated against the backend's settled actions like any other pending action.
- An on-chain approval that precedes the Order (`transactionApprove`) is an ordinary `send` step and keeps its local row, as every wallet-sent transaction does.
- The signing queue resolves once the Order is placed (`step-order-placed`); following its settlement belongs outside the queue ([WLT-3107](https://linear.app/zerion/issue/WLT-3107)), so a slow settlement never holds the queue line.

Consequences:

- One source of truth for an Order's status: the backend. No client-side order state to reconcile, expire or migrate.
- Between placement and the next pending-list refresh the Order is not yet visible in History; the form resets and the toaster keeps "Swapping"/"Bridging" in the meantime.
- Analytics no longer depend on a local row: the UI reports the placed Order over `uiReportOrderPlaced`, and the background emits `orderPlaced` → `Transaction: Signed Transaction` with `execution_type: 'intent'`.
