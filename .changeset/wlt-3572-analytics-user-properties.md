---
'zerion-wallet': patch
---

Stop the background worker from refreshing Mixpanel user properties on every
wake-up. A session restored at worker start no longer sends a Mixpanel identify;
a real unlock or an analytics opt-in still does. User properties are no longer
built from the `wallet/check-activity/v1` request, which now runs only during
wallet import. The `num_funded_wallets_with_provider`, `num_funded_evm_wallets`
and `num_funded_solana_wallets` user properties are no longer sent, so Mixpanel
keeps each profile's last value.
