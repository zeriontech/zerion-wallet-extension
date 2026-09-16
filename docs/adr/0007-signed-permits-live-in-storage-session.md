# Signed Permits live in `storage.session`, next to the unlock credentials

Supersedes [ADR-0006](./0006-signed-permits-live-in-the-wallet-record.md).

Confidential (Zama FHE) balances are decrypted by the backend only when the request carries the wallet's **Signed Permits** — EIP-712 signatures over backend-issued permits. ADR-0006 put them on the wallet entry inside the `WalletRecord` to get encryption at rest and delete-with-wallet for free. In practice the record on disk never held them (`walletToObject` does not copy the field), so they lived only in the service worker's memory and silently vanished when Chrome stopped the idle worker after ~30 s: confidential amounts re-locked without any user action, and the `Zerion-Confidential-Permits` header stopped being attached. Mirroring them into `storage.session` fixed the loss but left two copies and a restore step on every unlock.

Decision: `storage.session` is the **only** home. `src/background/Wallet/helpers/confidentialPermitsSession.ts` keeps a `Record<normalizedAddress, StoredPermit[]>` under one key; the `Wallet` class exposes `uiGetConfidentialPermits`, `setConfidentialPermits` and `clearConfidentialPermits` over it. Nothing permit-related is on `ExternallyOwnedAccount` or in the `WalletRecordModel`.

Why `storage.session` is the right store for this capability:

- **Same trust boundary as the encryption key.** The unlock credentials already live there (`Account`), so a permit next to them adds no new exposure. It is memory-only, per profile, readable only from extension contexts, and gone when the browser closes.
- **Lifetime matches the product rule "hide on lock".** `Account.removeCredentials` (lock and logout) clears the map together with the credentials. A service worker restart does not.
- **Delete with the wallet still holds.** `Wallet.removeAddress` drops the entry once the address is gone from every group — the same address may sit in several groups, so the check is "not found anywhere", not "removed from this group".
- **No coupling to the wallet lookup.** Data queries key on the permits query (`wallet/uiGetConfidentialPermits`), not on `wallet/uiGetWalletByAddress`. A Reveal or a 401 wipe invalidates only permit-keyed queries; wallet-entry consumers (source icons, Manage Wallets, Receive) are untouched.

Consequences a future contributor should expect:

- Writing is still a UI→background round-trip: the UI signs (background `signTypedData_v4` for bare wallets, mounted Ledger `HardwareSignMessage` for device accounts) and stores the whole array at once. **Reveal replaces the array wholesale**; one Reveal is a clean restart of the wallet's set. `setConfidentialPermits` throws for an address that is not in the record.
- Reading is a cheap port request, cached with `staleTime: Infinity` and invalidated explicitly by `invalidateConfidentialPermits()`. Do not poll it.
- Permits are not per-group: one address, one list.
- If the background ever needs decrypted totals itself (e.g. analytics), it reads `readSessionPermits()` directly; it does not need the record.
- Do not persist permits to `storage.local` or into the encrypted record. Re-locking on lock, logout and browser restart is intended; re-locking on a warm, unlocked worker is a bug — suspect the 401 wipe in `withPermits` or a short backend `expireAt`.
