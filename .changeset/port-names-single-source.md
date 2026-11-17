---
'zerion-wallet': patch
---

Internal: runtime port names are defined once in `src/shared/portNames` instead of being repeated as string literals in the UI, the content script and the service worker.
