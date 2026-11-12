---
'zerion-wallet': patch
---

Fix the wallet provider not being re-injected into pages after a timed "pause on all sites" expires (the content script was registered with an invalid match pattern).
