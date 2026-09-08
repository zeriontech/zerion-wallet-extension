# The Unknown receiver gate wraps the sign call, and fails closed

SendForm2 asks for one extra confirmation before sending to an **Unknown receiver** — an address in none of My wallets, the Watchlist, or the Address Book. Two things about `useUnknownReceiverGate` look like mistakes next to its sibling `useReadonlyReceiverGate`, which sits two files away and does the opposite in both cases.

## It wraps the sign call, not the button tap

`useReadonlyReceiverGate` wraps `fire` inside `SendButton`, so it interrupts the _tap_. This gate instead wraps `handleSignTransaction` inside `SendForm2`.

The dialog's whole job is to show the user what the transaction actually does, and that means the interpreted **Address Action** from the Simulation, which does not exist until after `fire` has completed its round trip. Gating the tap would leave us composing a local `createSendTokenAddressAction` — our own guess about the very thing the user is being asked to verify.

The second reason is coverage. There are two entry points into signing: the auto-sign branch in `handleSimulationCompleted`, and the footer's `onSign` (the second tap, or the hold on `DangerSignButton`). Both must be confirmed. Wrapping the one function they share is the only placement that gets both without duplicating the predicate.

Consequences a future contributor should expect:

- The confirmation also appears **after** a hold-to-sign on the danger path. It reflects the warning inside the dialog (a danger-styled "Send Anyway"), but it never asks for a second hold — the user has already held once, and re-asking would read as a bug.
- Interposing counts as having simulated (`onIntercept`), so dismissing the dialog leaves the footer on "Confirm Send" rather than sending the user back through another Simulation.
- The gate carries the pending `SimulationResult` in state so it can replay the exact result it interrupted. Do not re-read `simulationResult` from the form on confirm.

## It fails closed

`useReadonlyReceiverGate` requires its wallet-groups query to resolve before it warns (`shouldGate = Boolean(walletGroup && …)`), so an unresolved query means no dialog. `resolveReceiverFamiliarity` does the reverse: it matches the receiver against three lists that are simply _empty_ while the wallet-groups query and preferences are loading, so an unresolved state matches nothing and reads as `unknown`.

That is deliberate, and it is why the pure function takes lists rather than a "loaded" flag — failing closed is the natural consequence of the data shape, not a branch someone can delete by accident. A read-only receiver that we fail to recognize costs the user nothing; an unknown receiver that we fail to recognize is the exact case this dialog exists for.

The cost is a false positive: send to a saved address in the first moments after unlock, before preferences arrive, and you get the confirmation anyway. We accept that.

## Recents are not a source

`recentAddresses` is written on every successful broadcast. Counting recents as known would give the confirmation exactly one chance per address — the second send to a mistyped address would go through unchallenged. There is deliberately no "don't show again" preference either: saving the address to the Address Book _is_ the opt-out, and it is the one that leaves the user better off.

## The address is rendered in full

The dialog does not reuse the shared `RecipientLine`, which truncates to 15/15 characters. The user is here to compare the address against wherever they copied it from, so `ReceiverAddressBlock` renders it through `FullAddress` (head ellipsized, tail pinned) with a copy button. This restates WLT-1998's requirement; do not swap in `RecipientLine` for consistency's sake.
