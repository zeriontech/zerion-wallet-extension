# Signed Permits live inside the encrypted WalletRecord, not in a store

Confidential (Zama FHE) balances are decrypted by the backend only when the request carries the wallet's **Signed Permits** — EIP-712 signatures the wallet produced over backend-issued permits. The obvious home for them, and what the web app does, is a standalone store (`localStorage` there; here it would be a `PersistentStore` in `browser.storage.local`). We instead store them on the wallet itself: `confidentialPermits?: StoredPermit[]` on `ExternallyOwnedAccount`, next to `name`, so they ride inside the encrypted `WalletRecord`.

Why: a Signed Permit is a wallet-scoped capability. Anyone holding it can ask the backend for that wallet's decrypted amounts, so it deserves the same at-rest protection as the wallet's other data, and it must disappear exactly when the wallet does. Keeping it in the record gives both for free — encryption through the existing record persistence, deletion through the existing `removeAddress` path, and consistency across the multiple groups that may hold the same address (handled like `renameAddress`). A separate store would need its own encryption, its own `removeWallet` cleanup and its own reconciliation with the record.

Consequences a future contributor should expect:

- Writing a permit is a UI→background round-trip (`setConfidentialPermits` / `clearConfidentialPermits` on the `Wallet` class); the UI signs — via the background's `signTypedData_v4` for bare wallets, via the mounted Ledger `HardwareSignMessage` for device accounts — and then stores the whole array at once. Reading is free: `maskWallet` strips only `privateKey`/`mnemonic`, so `uiGetWalletByAddress` already exposes `confidentialPermits` to the UI.
- The field is optional and no record-version bump is made; `undefined` means "no permits". Do not add a migration to backfill `[]`.
- **Reveal** replaces the array wholesale rather than appending, so one Reveal is a clean restart of the wallet's permit set.
- The background cannot attach permits without reading the record — which it can. If the analytics user-properties portfolio fetch ever needs decrypted totals, it reads from the record, not from a UI store.
- Permits are _not_ per-account-in-group: the same address in two groups gets the same array written to both, exactly like `name`.
