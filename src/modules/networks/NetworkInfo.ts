import type {
  ChainFullInfo,
  ChainSpecification,
} from 'src/modules/zerion-api/types/ChainFullInfo';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';

/**
 * The slice of {Fungible} a chain's base asset needs. Per-chain `address` and
 * `decimals` live in `implementations[chain.id]`, see {getBaseAssetImplementation}.
 * `verified`, `new` and `meta` are never read off a chain's base asset and a
 * synthesized chain has no honest value for them.
 */
export type ChainBaseAsset = Pick<
  Fungible,
  'id' | 'name' | 'symbol' | 'iconUrl' | 'implementations'
>;

/**
 * The extension's chain model: ZPI's {ChainFullInfo} plus the client-side state
 * the extension keeps for a chain. {ChainFullInfo} is assignable to it, so a
 * backend chain needs no mapping; dApp-added chains are synthesized with
 * `toNetworkInfo` and user edits are applied with `applyChainConfig`.
 * See docs/adr/0004-networkinfo-chain-model.md
 */
export type NetworkInfo = Omit<ChainFullInfo, 'baseAsset'> & {
  baseAsset?: ChainBaseAsset | null;
  /** Client-side. Whether to display this network among select options */
  hidden?: boolean;
  /** Client-side. User-defined RPC URL; wins over rpcUrl and publicRpcUrl */
  rpcUrlUser?: string;
};

export type NetworkInfoEip155 = NetworkInfo & {
  specification: ChainSpecification & {
    eip155: NonNullable<ChainSpecification['eip155']>;
  };
};

/** The base asset as implemented on its own chain: `address` is null for a native asset */
export function getBaseAssetImplementation(
  network: Pick<NetworkInfo, 'id' | 'baseAsset'>
) {
  return network.baseAsset?.implementations[network.id];
}

export function getBaseAssetDecimals(
  network: Pick<NetworkInfo, 'id' | 'baseAsset'>
): number | undefined {
  return getBaseAssetImplementation(network)?.decimals;
}
