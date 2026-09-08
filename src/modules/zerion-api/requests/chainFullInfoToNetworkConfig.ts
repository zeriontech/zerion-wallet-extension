import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { ChainFullInfo } from '../types/ChainFullInfo';

/**
 * Adapts ZPI's {ChainFullInfo} to the extension's {NetworkConfig}.
 *
 * Returns null for chains whose `specification` names a standard the extension
 * does not model (e.g. tron): {NetworkConfig.standard} is derived from the
 * populated `specification` key, and a chain without one would produce a config
 * whose `standard` lies about its contents.
 *
 * `explorer_urls`, `wrapped_native_asset` and `specification.eip155.eip1559`
 * have no ZPI source and no readers; they are left undefined.
 */
export function chainFullInfoToNetworkConfig(
  chain: ChainFullInfo
): NetworkConfig | null {
  const { specification } = chain;
  const standard = specification.eip155
    ? 'eip155'
    : specification.solana
    ? 'solana'
    : null;
  if (!standard) {
    return null;
  }
  // `decimals` and `address` are per-chain values and live in `implementations`,
  // keyed by the same network id space as {NetworkConfig.id}
  const implementation = chain.baseAsset?.implementations[chain.id];
  return {
    id: chain.id,
    name: chain.name,
    icon_url: chain.iconUrl ?? '',
    is_testnet: chain.testnet,
    standard,
    specification: specification.eip155
      ? { eip155: { id: specification.eip155.chainId } }
      : { solana: specification.solana },
    native_asset:
      chain.baseAsset && implementation
        ? {
            id: chain.baseAsset.id,
            name: chain.baseAsset.name,
            symbol: chain.baseAsset.symbol,
            icon_url: chain.baseAsset.iconUrl,
            decimals: implementation.decimals,
            address: implementation.address,
          }
        : null,
    explorer_name: chain.explorer?.name ?? null,
    explorer_tx_url: chain.explorer?.txUrl ?? null,
    explorer_token_url: chain.explorer?.tokenUrl ?? null,
    explorer_address_url: chain.explorer?.addressUrl ?? null,
    explorer_home_url: chain.explorer?.homeUrl ?? null,
    rpc_url_internal: chain.rpcUrl,
    /** ZPI supplies exactly one; the array shape exists for dApp-added chains */
    rpc_url_public: chain.publicRpcUrl ? [chain.publicRpcUrl] : null,
    supports_trading: chain.flags.supportsTrading,
    supports_sending: chain.flags.supportsSending,
    supports_bridging: chain.flags.supportsBridging,
    supports_actions: chain.flags.supportsActions,
    supports_positions: chain.flags.supportsPositions,
    supports_nft_positions: chain.flags.supportsNftPositions,
    supports_sponsored_transactions: chain.flags.supportsSponsoredTransactions,
    supports_simulations: chain.flags.supportsSimulations,
  };
}
