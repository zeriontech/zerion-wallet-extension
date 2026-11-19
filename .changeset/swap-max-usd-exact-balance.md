---
'zerion-wallet': patch
---

Swap: MAX in the USD input mode now uses the exact token balance instead of the balance converted to dollars and rounded to cents, which could ask for slightly more than the wallet held and show the balance in red. Toggling the input mode after MAX keeps the exact amount.
