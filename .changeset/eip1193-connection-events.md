---
'zerion-wallet': patch
---

Add unit tests for the injected provider's EIP-1193 events (`connect`, `chainChanged`, `accountsChanged`) and remove an unreachable code path that re-emitted `connect` when a site was approved. Dapps are notified of approval through `accountsChanged`, as before.
