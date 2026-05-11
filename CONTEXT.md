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

## Flagged ambiguities

- "Slippage" was used by some contributors to mean both the user's tolerance setting (the slippage parameter on the swap) and any output divergence — resolved: the latter is **Output mismatch**, the former is just "slippage setting / tolerance".
- "Warning" overlaps with "error" in the API and the UI. Resolved: in the UI, `TransactionWarning` has two visual variants (`warning` and `error`), but both are types of "warnings" conceptually — the distinction is severity-driven, not categorical.
