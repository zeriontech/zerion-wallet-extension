---
'zerion-wallet': patch
---

Swap: MAX in the USD input mode now fills the exact dollar value of the token balance and quotes that exact balance, instead of rounding the dollars to cents and then resolving slightly more tokens than the wallet held (which showed the balance in red). Toggling the input mode after MAX keeps the exact amount.
