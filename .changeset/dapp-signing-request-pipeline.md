---
'zerion-wallet': patch
---

Internal: dapp signing requests (transactions, messages, typed data, Solana) share one permission check and one approval-dialog opener. Behaviour is unchanged, including the order in which the checks run.
