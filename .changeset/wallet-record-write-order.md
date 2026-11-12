---
'zerion-wallet': patch
---

Fix a race where two quick changes to the wallet (for example a rename followed by a settings change) could be saved in the wrong order and the newer one lost after a restart. Creating or importing a wallet now waits until the wallet is stored before reporting success.
