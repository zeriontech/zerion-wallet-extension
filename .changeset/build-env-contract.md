---
'zerion-wallet': patch
---

Build: drop `DEFI_SDK_TRANSACTIONS_API_URL`, `FEATURE_BRIDGE_FORM` and `FEATURE_SEND_FORM` from the build environment; nothing read them. Developers must delete the first two keys from their local `.env` (the pre-start check rejects keys that are not in `.env.example`).
