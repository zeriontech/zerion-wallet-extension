# NetworkInfo: the extension's chain model is ZPI's ChainFullInfo plus two client-side fields

The extension used to keep chain data in its own snake_case `NetworkConfig` shape, fed first by the defi-sdk socket and, after PR 12, by an adapter over ZPI's `chain/list/v1` / `chain/get/v1`. Series 2 retires that shape: the model is now `NetworkInfo` in `src/modules/networks/NetworkInfo.ts`.

```ts
type ChainBaseAsset = Pick<
  Fungible,
  'id' | 'name' | 'symbol' | 'iconUrl' | 'implementations'
>;
type NetworkInfo = Omit<ChainFullInfo, 'baseAsset'> & {
  baseAsset?: ChainBaseAsset | null;
  hidden?: boolean; // client-side
  rpcUrlUser?: string; // client-side
};
```

`ChainFullInfo` is assignable to `NetworkInfo`, so a backend chain needs no mapping. Chains ZPI does not return (dApp-added) are **synthesized** with `toNetworkInfo(AddEthereumChainParameter)`, and saved user edits are applied to any chain with `applyChainConfig`. Persisted data is untouched: `ChainConfigStore` keeps storing `AddEthereumChainParameter`, and the v0 on-disk shape in `chains/types.ts` is only read by the migration.

## Decisions

- **Flat intersection, not a `{ chain, local }` wrapper.** Consumers read `network.id`, `.name`, `.iconUrl` on one dot in ~60 files; a wrapper would make every read two dots for the sake of two optional fields.
- **`baseAsset` is a `Pick` of `Fungible`, not the full type.** `verified`, `new` and `meta` (price, market cap, supply) are never read off a chain's base asset, a synthesized chain has no honest value for them, and the bundled fallback must not carry price data. Per-chain `address` and `decimals` live in `implementations[chain.id]`; `getBaseAssetImplementation` / `getBaseAssetDecimals` read them.
- **One `publicRpcUrl: string`, not an array.** Only the first public URL was ever read, and re-saving a chain already collapsed the list to one URL. The dApp's full `rpcUrls` list stays in `ChainConfigStore`, which remains the array of record.
- **`standard` is derived, not stored.** `Networks.isEip155(n)` narrows to `NetworkInfoEip155`; `Networks.getEcosystem(n)` reads the `specification` keys. Chains of a standard the extension does not model (tron) are dropped at the list boundary in `networks-api.ts`.
- **Explorer is synthesized for custom chains.** A dApp only gives an explorer home URL; `synthesizeExplorer` derives Etherscan-style `/tx`, `/address` and `/token` templates from it, so `NetworkInfo.explorer` stays identical to `ChainExplorer` and `Networks` has no home-URL fallback branch.
- **The fallback is generated, not hand-written.** `networks-fallback.json` is a snapshot of the mainnet supported list stripped to `NetworkInfo`, refreshed by `npm run refresh-networks-fallback`. It is mainnet-only.

## Considered options

- **Keep `NetworkConfig` and the adapter forever** — rejected: two names for every chain field, a translation layer to maintain, and no way to adopt new ZPI chain fields without extending the adapter.
- **A `{ chain: ChainFullInfo, local: {...} }` wrapper** — rejected for the reason above; the type would be purer but every consumer noisier.
- **Full `Fungible` on `baseAsset`** — rejected: fabricated `verified`/`meta` values for synthesized chains and 65 chains of stale price data in the bundle.
- **Nullable explorer sub-fields instead of synthesis** — rejected: drifts the extension type from `ChainFullInfo` and gives custom chains no address/token links.

## Consequences

- Address and token explorer links now appear for custom chains (previously only the transaction link, via a home-URL fallback).
- Editing a backend chain keeps its base-asset icon and id; a custom chain's base-asset id is always the lowercased symbol. These unify two paths that previously disagreed.
- `Networks.supports('trading', chain)` keeps its purpose vocabulary and maps onto `flags.supportsTrading`.
- `flags.supportsGasPrices` is on the type and unused; gas prices are still gated on `Networks.isEip155`.
