## NOTES

### RPC Urls

- `rpc_url_internal` is used to submit transactions and query tx data, such as allowance and gas estimations
- `rpc_url_public` is used when an rpc request comes from the dapp
- `rpc_url_user` is used as an override for the above values
- [x] when an `AddEthereumChainParameter` comes from the dapp, its RPC Url is currently being set to both `rpc_url_internal` and to `rpc_url_public`. This is wrong, it should either always be set to `rpc_url_user`, OR:
  - if `rpc_url_internal` exists, introduce `rpc_url_user`
  - else set `rpc_url_public` (this is how current <NetworkForm /> works)

### Chain, chainId and external_id

- HEX chain id is stored in `specification` object inside NetworkConfig
- for chain configs coming from dApps, `id` is get from backend for the chain with the same `chainId` or directly from `chainId`
- for manually added networks, `id` is currently created equal to `chainId` and will be updated if `chainId` is updated.

### Creating/modifying a chain

- When we modify existing "mainnet" item `A`, an `EthereumChainConfig` is created, which has the same `id` as `A`
- [x] When a new `AddEthereumChainParameter` comes from dapp, an `EthereumChainConfig` is (should be) created with an `id` got from backend if we have information about the chain with the same `chainId` or generated from `chainId`.
- [x] When an `AddEthereumChainParameter` comes which has a `chainId` matching any existing network, we should use the `id` from existing network and call `ChainConfigStore.addEthereumChain()`.

### Backend Updates

- [ ] User has manually created a network `A` with chainId: `'a'` and a generated `id` value. Later our backend starts to support a network with chainId: `'a'`. We are going to merge updated config with locally saved. So saved data will remain the same, however extra data (like `'supports_...'` fields) will be updated.

### Edge cases

What if user has manually created a network A with chainId: `'a'` and then a dapp request comes to overwrite it with a new RPC Url, but the dapp also has a different `nativeCurrency` configuration? Maybe this configuration is correct for the suggested rpc url?
