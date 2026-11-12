---
'zerion-wallet': patch
---

Internal: move the referral program background service and its storage helper from `src/ui/features` to `src/modules/referral-program`, so the service worker no longer imports from the UI tree.
