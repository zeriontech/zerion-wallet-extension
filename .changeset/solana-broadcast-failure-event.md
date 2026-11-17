---
'zerion-wallet': patch
---

The "Signed Transaction" analytics event now reports failed transactions with the same error fields as the iOS app: an error code and stage, the node's own message, and the wallet address, for EVM and Solana broadcasts as well as Solana signing failures. Addresses and hashes are redacted from the reported messages.
