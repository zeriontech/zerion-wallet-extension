---
'zerion-wallet': patch
---

WLT-2752: offer a one-tap switch to Slow on the confirm screen when Fast minus Slow for this transaction reaches the `extension_fee_hint_config.min_savings_usd` remote-config threshold (default $1), and report `fee_hint_shown` on `signed_transaction`. The Average speed is already labelled Slow; its backend key is unchanged.
