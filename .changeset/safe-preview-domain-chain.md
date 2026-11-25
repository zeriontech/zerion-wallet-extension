---
'zerion-wallet': minor
---

Safe transaction previews now resolve the chain from the typed data's EIP-712 domain, so a Safe transaction signed on Base is previewed and simulated on Base even when the dapp's selected chain is Ethereum. Other typed data keeps using the dapp's selected chain.
