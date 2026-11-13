---
'zerion-wallet': patch
---

Signing previews pick the label line by its title: an application with no known dapp shows an "Application" line instead of "Recipient", and `to`/`from` labels show their own caption. Addresses of non-trackable wallets copy on tap instead of opening the explorer, and each such copy sends the `Label Address Copied` analytics event.
