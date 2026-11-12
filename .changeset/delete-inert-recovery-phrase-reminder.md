---
'zerion-wallet': patch
---

Internal: removed the proactive recovery-phrase reminder, which had been inactive since its feature gate was removed. The restoration dialog still opens when a recovery phrase cannot be decrypted.
