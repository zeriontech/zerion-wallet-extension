---
'zerion-wallet': patch
---

Signing previews pick the label line by its title: an application label with no known dapp shows an "Application" line instead of "Recipient", and `to`/`from` labels show their own caption. Every label address in the signing preview and the Advanced view now copies on tap instead of opening the explorer. Copies of non-trackable wallets send the `Label Address Copied` analytics event.
