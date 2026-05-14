# Receiver picker: `predicate` filters; `validateMatch` is display-only

The Receiver picker dialog accepts two callbacks from its caller: `predicate(address)` and `validateMatch(address)`. They look like overlapping ways to reject an address, but they are deliberately separated by concern.

`predicate` is the sole gate on what renders. If `predicate(address) === false`, the row is hidden — applies uniformly to Recents, My wallets, Watchlist, and **Exact match**. `validateMatch` never affects visibility; it only produces an error string that the dialog renders below the search input.

We considered collapsing both into a single "validate" function that returns either `true` or an error string. We rejected that because the two concerns have different scopes: predicate runs over every list row (cheap, called many times during virtualization), while validateMatch runs only on the resolved typed address (allowed to be expensive, format-aware error strings). Mixing them would force every list row to go through error-string formatting it doesn't need, and would make the "hide row" decision implicit in "returns empty string".

The non-obvious consequence: in SwapForm2's cross-ecosystem case, a typed address that fails the predicate (wrong ecosystem) is **hidden** from Exact match, and the error caption from validateMatch tells the user why. A future contributor may assume the typed address should always appear as Exact match — it does not, by design.
