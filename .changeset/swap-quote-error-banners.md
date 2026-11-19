---
'zerion-wallet': patch
---

Swap form quote errors follow the cross-platform rules. Insufficient balance and insufficient gas show our own wording with a `Top Up {SYMBOL}` button that opens Add Funds on the missing token, at any input balance. A geo-blocked swap and any other quote error show a gray "Error" card instead of "Transaction will fail", with the backend message for unknown codes.
