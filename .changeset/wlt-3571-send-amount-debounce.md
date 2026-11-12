---
'zerion-wallet': patch
---

Send hides the previous quote and keeps Send disabled while a typed amount is still debouncing, so a stale transaction is never simulated or signed. An empty, zero or non-integer ERC-1155 amount sends no get-send request.
