# Grouped Positions for read surfaces, Simple Positions for trading surfaces

The extension used to fetch one flat list of per-chain rows (`wallet/get-positions/v1`, the defi-sdk `AddressPosition` shape: one row per asset per chain per app, with `parent_id` nesting, `apy`, a raw base-unit quantity) and rebuilt every read view on the client: grouping by dapp, then by name, then by parent, and, on All Networks, summing the Wallet group's rows per asset into a cross-chain row with a per-chain tooltip. Swap, Send, Perps deposit and the asset page had already moved to `wallet/get-simple-positions/v1` and `wallet/get-asset-details/v1`.

Decision: the flat endpoint is gone from the extension. Two units remain, chosen by what the screen does (see **Read surface / Trading surface** in `CONTEXT.md`):

- **Read surfaces** — Overview Tokens tab, Stats drill-down, Protocol Distribution, Reveal Dialog — consume **Grouped Positions** (`wallet/get-grouped-positions/v1`, `groupBy: ['by-app']`, `chainIds` for the chain filter). The backend delivers the Apps, the Wallet Bucket and the Position Groups; the client only orders them and pins the gas token.
- **Trading surfaces and chain-exact balance checks** — Swap, Send, Perps deposit, the approve-amount view, the native-balance fee check and network picker rows, the quote-error analytics balance — consume **Simple Positions** and pick a row by `(chain.id, fungible.id)`.

Why one endpoint per kind, not one endpoint for everything:

- A Grouped Position sums an asset across chains and carries no chain-exact amount, so it cannot back a transaction or a fee check. A Simple Position is chain-exact but has no App, no Position Group and no portfolio share, so a read view built on it would recreate the client-side grouping the backend now owns.
- The web app made the same split (`overview-layout-v3`), so the two clients render the same numbers from the same responses.
- The chain filter became a server-side `chainIds` request: a chain-scoped list is a different aggregation, not a subset of the All Networks list, so each selected chain is its own cached query.

What was deliberately dropped, because the grouped endpoint cannot supply it and the flat endpoint is not kept for it:

- The per-chain quantity/value tooltip on a multi-chain Wallet Bucket row. The row shows a pie icon; the per-chain breakdown lives on the asset page.
- Parent/child nesting inside an App (`parent_id`, the connector line). An App is App header → Position Group sub-heading → flat rows.
- `apy` (never rendered in the extension).

Consequences a future contributor should expect:

- Do not add a `walletGetPositions` request back for a single feature; if a read view needs a chain-exact figure, that view is a trading surface and should read Simple Positions.
- `filterDisplayableApps` drops backend-flagged spam/dust from the Wallet Bucket only; DeFi Apps are never filtered.
- Chains the backend does not index still come from the RPC node (`useAddressPositionsFromNode`) and are adapted into a single-chain Grouped Position inside a synthetic Wallet Bucket (`addressPositionsToApps`), so `PositionList` has one input shape.
- Protocol Distribution sums each App **gross** from its positions rather than trusting the backend's (net) `apps[].value`, so a leveraged App keeps a positive tile.
- The Reveal Dialog flattens the Overview's own by-app query; `permit_count` is the number of distinct chain ids across the encrypted rows.
