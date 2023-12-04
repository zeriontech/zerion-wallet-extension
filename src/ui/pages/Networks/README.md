## NOTES

### RPC Urls

- `rpc_url_internal` is used to submit transactions and query tx data, such as allowance and gas estimations
- `rpc_url_public` is used when an rpc request comes from the dapp
- `rpc_url_user` is used as an override for the above values
- [x] when an `AddEthereumChainParameter` comes from the dapp, its RPC Url is currently being set to both `rpc_url_internal` and to `rpc_url_public`. This is wrong, it should either always be set to `rpc_url_user`, OR:
  - if `rpc_url_internal` exists, introduce `rpc_url_user`
  - else set `rpc_url_public` (this is how current <NetworkForm /> works)

### Chain, chainId and external_id

- `chain` is used as a slug-like unique `id`
- `external_id` is a name for `chainId`
- `evm_id` is an int representation of `external_id`, therefore is unnecessary
- for chain configs coming from dApps, `chain` is generated using `nanoid()`
- for manually added networks, `chain` is currently created equal to `external_id`. This is wrong, because `external_id` can be changed later by the user, but `chain` will remain untouched. If a user manually creates network A with external_id: `'a'`, then later updates external_id to `'b'`, then later creates network `AA`, sets its external_id to `'a'`, network `AA` will overwrite network `A`.

### Creating/modifying a chain

- When we modify existing "mainnet" item `A`, an `EthereumChainConfig` is created, which has the same `chain` and `external_id` as `A`
- [x] When a new `AddEthereumChainParameter` comes from dapp, an `EthereumChainConfig` is (should be) created with a generated nanoid() for `chain`
- [x] When an `AddEthereumChainParameter` comes which has a `chainId` matching any existing network, we should use the `chain` from existing network and call `ChainConfigStore.addEthereumChain()`.

### Backend Updates

- [ ] User has manually created a network `A` with chainId: `'a'` and a generated `chain` value. Later our backend starts to support a network with chainId: `'a'`. Should we determine that and update the manually added network's value of `chain` to the new `chain` value that now comes from the backend? This would effectively "merge" the manual config with the backend one.

### Edge cases

What if user has manually created a network A with chainId: `'a'` and then a dapp request comes to overwrite it with a new RPC Url, but the dapp also has a different `nativeCurrency` configuration? Maybe this configuration is correct for the suggested rpc url?
