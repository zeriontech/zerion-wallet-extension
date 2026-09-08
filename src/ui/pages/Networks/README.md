## NOTES

### RPC Urls

- `rpcUrl` (Zerion's) is used to submit transactions and query tx data, such as allowance and gas estimations
- `publicRpcUrl` is used when an rpc request comes from the dapp
- `rpcUrlUser` is a user-defined override for both of the above; `applyChainConfig` sets it (and `publicRpcUrl`) from the saved `AddEthereumChainParameter.rpcUrls[0]`
- for a synthesized chain (one the backend does not know) the user's URL is all three

### Chain, chainId and external_id

- the decimal chain id is stored in `specification.eip155.chainId` inside `NetworkInfo`; `Networks.getChainId()` normalizes it to HEX
- for chain configs coming from dApps, `id` is queried from backend for the chain with the same `chainId` or derived directly from `chainId`
- for manually added networks, `id` is currently deterministically created from `chainId` and will be updated if `chainId` is updated.

### Creating/modifying a chain

- When we modify existing "mainnet" item `A`, an `EthereumChainConfig` is created, which has the same `id` as `A`
- [x] When a new `AddEthereumChainParameter` comes from dapp, an `EthereumChainConfig` is (should be) created with an `id` received from backend if we have information about the chain with the same `chainId` or generated from `chainId`.
- [x] When an `AddEthereumChainParameter` comes which has a `chainId` matching any existing network, we should use the `id` from existing network and call `ChainConfigStore.addEthereumChain()`.

### Backend Updates

- [ ] User has manually created a network `A` with chainId: `'a'` and a generated `id` value. Later our backend starts to support a network with chainId: `'a'`. We are going to merge updated config with locally saved. So saved data will remain the same, however extra data (like the `flags`) will be updated.

### Edge cases

What if user has manually created a network A with chainId: `'a'` and then a dapp request comes to overwrite it with a new RPC Url, but the dapp also has a different `nativeCurrency` configuration? Maybe this configuration is correct for the suggested rpc url?
