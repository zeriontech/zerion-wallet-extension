import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { capitalize } from 'capitalize-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/types';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { FEATURE_SOLANA } from 'src/env/config';
import type { ChainId } from '../ethereum/transactions/ChainId';
import type { Chain } from './Chain';
import { createChain } from './Chain';
import type { Eip155Specification, NetworkConfig } from './NetworkConfig';
import { getAddress } from './asset';
import { UnsupportedNetwork } from './errors';
import { injectChainConfig } from './injectChainConfig';

type Collection<T> = { [key: string]: T };

type SupportsFlags = Exclude<
  keyof {
    [K in keyof NetworkConfig as K extends `supports_${infer S}`
      ? S
      : never]: NetworkConfig[K];
  },
  'bridge' // supports_bridge is deprecated
>;

function toCollection<T, K>(
  items: T[],
  getKey: (item: T) => string | null,
  getItem: (item: T) => K
) {
  const result: Collection<ReturnType<typeof getItem>> = {};
  for (const item of items) {
    const key = getKey(item);
    if (key) {
      result[key] = getItem(item);
    }
  }
  return result;
}

function injectChainConfigs(
  networkConfigs: NetworkConfig[],
  chainConfigs: EthereumChainConfig[]
): NetworkConfig[] {
  const chainConfigById = Object.fromEntries(
    chainConfigs.map((config) => [config.id, config.value])
  );
  return networkConfigs.map((network) =>
    injectChainConfig(network, chainConfigById[network.id] || null)
  );
}

export interface NetworkConfigMetaData {
  created: number;
  updated: number;
  origin: string;
}

function toAliasMap(ethereumChainConfigs: EthereumChainConfig[]) {
  const result: Record<string, string> = {};
  for (const { previousIds, id } of ethereumChainConfigs) {
    if (previousIds) {
      for (const previousId of previousIds) {
        result[previousId] = id;
      }
    }
  }
  return result;
}

export class Networks {
  private networks: NetworkConfig[];
  private collection: { [key: string]: NetworkConfig | undefined };
  private collectionByEvmId: { [key: ChainId]: NetworkConfig | undefined };
  private networkIdAliases: Record<string, string>;
  private ethereumChainConfigs: EthereumChainConfig[];
  private visitedChains: Set<string>;

  private solanaNetworks: NetworkConfig[];
  private evmNetworks: NetworkConfig[];

  static getChainId<T extends Partial<NetworkConfig>>(network: T) {
    if (Networks.isEip155(network)) {
      return normalizeChainId(network.specification.eip155.id);
    }
    throw new Error(`Network is not eip-155: ${network.id}`);
  }

  static isEip155<T extends Partial<NetworkConfig>>(
    network: T
  ): network is T & Eip155Specification {
    return network.specification?.eip155 != null;
  }

  static getEcosystem(network: NetworkConfig): BlockchainType {
    if (Networks.isEip155(network)) {
      return 'evm';
    } else if (network.id === 'solana') {
      return 'solana';
    } else {
      throw new Error(
        `Cannot infer ecosystem of ${network.id} (${network.name})`
      );
    }
  }

  static predicate(standard: BlockchainType | null, network: NetworkConfig) {
    if (standard === 'solana') {
      return network.standard === 'solana';
    } else if (standard === 'evm') {
      return network.standard === 'eip155';
    } else {
      return true;
    }
  }

  constructor({
    networks,
    ethereumChainConfigs,
    visitedChains,
  }: {
    networks: NetworkConfig[];
    ethereumChainConfigs: EthereumChainConfig[];
    visitedChains: string[];
  }) {
    this.ethereumChainConfigs = ethereumChainConfigs;
    this.networks = injectChainConfigs(networks, ethereumChainConfigs);
    if (FEATURE_SOLANA !== 'on') {
      this.networks = this.networks.filter((n) => n.standard === 'eip155');
    }
    this.evmNetworks = this.networks.filter((n) => n.standard === 'eip155');
    this.solanaNetworks = this.networks.filter(
      (n) => n.id.toLowerCase().includes('solana') // TODO: filter by n['standard'] when backend updates
    );
    this.collection = toCollection(
      this.networks,
      (network) => network.id,
      (x) => x
    );
    this.collectionByEvmId = toCollection(
      this.evmNetworks,
      (x) => Networks.getChainId(x),
      (x) => x
    );
    this.networkIdAliases = toAliasMap(this.ethereumChainConfigs);
    this.visitedChains = new Set(visitedChains);
  }

  static getName(network: NetworkConfig) {
    return network.name || capitalize(network.id);
  }

  getByNetworkId(id: Chain) {
    return (
      this.collection[id.toString()] ||
      this.collection[this.networkIdAliases[id.toString()]]
    );
  }

  /** @deprecated, prefer {this.getByNetworkId} */
  getNetworkByName(chain: Chain) {
    return this.getByNetworkId(chain);
  }

  private toId(chain: Chain) {
    const item = this.getByNetworkId(chain);
    return item && Networks.isEip155(item) ? Networks.getChainId(item) : null;
  }

  isSavedLocallyChain(chain: Chain) {
    return this.ethereumChainConfigs.some(
      (item) => item.id === chain.toString()
    );
  }

  isVisitedChain(chain: Chain) {
    return this.visitedChains.has(chain.toString());
  }

  getNetworks() {
    return this.networks;
  }

  getEvmNetworks() {
    return this.evmNetworks;
  }

  getNetworksCollection() {
    return this.collection;
  }

  getMainnets() {
    return this.networks.filter((item) => !item.is_testnet);
  }

  getDefaultNetworks(standard: BlockchainType | 'all') {
    const items =
      standard === 'solana'
        ? this.solanaNetworks
        : standard === 'evm'
        ? this.evmNetworks
        : this.networks;
    const ignorePositionsSupport = standard === 'solana'; // TODO: remove check when backend supports Solana positions
    return items.filter((item) => {
      const chain = createChain(item.id);
      return (
        ignorePositionsSupport ||
        this.supports('positions', chain) ||
        this.isSavedLocallyChain(chain) ||
        this.isVisitedChain(chain)
      );
    });
  }

  getNetworksMetaData(): Record<string, NetworkConfigMetaData | undefined> {
    return Object.fromEntries(
      this.ethereumChainConfigs.map((chainConfig) => [
        chainConfig.id,
        chainConfig,
      ])
    );
  }

  getChainId(chain: Chain) {
    return this.toId(chain);
  }

  getNativeAssetIdsForTrading() {
    return this.networks
      .filter((network) => network.supports_trading && network.native_asset)
      .map((network) => network.native_asset?.id)
      .filter(isTruthy);
  }

  getChainName(chain: Chain) {
    return this.getByNetworkId(chain)?.name || capitalize(String(chain));
  }

  getNetworkById(chainId: ChainId) {
    const network = this.collectionByEvmId[chainId];
    if (!network) {
      throw new UnsupportedNetwork(`Unsupported network id: ${chainId}`);
    }
    return network;
  }

  hasNetworkById(chainId: ChainId) {
    return Boolean(this.collectionByEvmId[chainId]);
  }

  getChainById(chainId: ChainId): Chain {
    const network = this.getNetworkById(chainId);
    return createChain(network.id);
  }

  getChainNameById(chainId: ChainId) {
    const network = this.getNetworkById(chainId);
    return this.getChainName(createChain(network.id));
  }

  getExplorerHomeUrlByName(chain: Chain) {
    return this.getByNetworkId(chain)?.explorer_home_url;
  }

  private getExplorerTxUrl(network: NetworkConfig | undefined, hash: string) {
    if (network?.explorer_tx_url) {
      return network.explorer_tx_url?.replace('{HASH}', hash);
    } else if (network?.explorer_home_url) {
      return new URL(`/tx/${hash}`, network.explorer_home_url).toString();
    }
  }

  getExplorerTxUrlById(chainId: ChainId, hash: string) {
    return this.getExplorerTxUrl(this.collectionByEvmId[chainId], hash);
  }

  getExplorerTxUrlByName(chain: Chain, hash: string) {
    return this.getExplorerTxUrl(this.getByNetworkId(chain), hash);
  }

  getExplorerAddressUrlByName(chain: Chain, address: string) {
    return this.getExplorerAddressUrl(this.getByNetworkId(chain), address);
  }

  private getExplorerAddressUrl(
    network: NetworkConfig | undefined,
    address: string
  ) {
    return network?.explorer_address_url?.replace('{ADDRESS}', address);
  }

  private getExplorerTokenUrl(
    network: NetworkConfig | undefined,
    address: string
  ) {
    return network?.explorer_token_url?.replace('{ADDRESS}', address);
  }

  getExplorerTokenUrlByName(chain: Chain, address: string) {
    return this.getExplorerTokenUrl(this.getByNetworkId(chain), address);
  }

  getExplorerNameByChainName(chain: Chain) {
    return this.getByNetworkId(chain)?.explorer_name;
  }

  supports(purpose: SupportsFlags, chain: Chain): boolean {
    const network = this.getByNetworkId(chain);
    if (!network) {
      return false;
    }
    return network[`supports_${purpose}`];
  }

  static isNativeAsset(asset: Asset, network: NetworkConfig) {
    if (network.native_asset) {
      const address = getAddress({ asset, chain: createChain(network.id) });
      return address === network.native_asset.address;
    } else {
      return false;
    }
  }

  isNativeAsset(asset: Asset, chainId: ChainId): boolean {
    const network = this.getNetworkById(chainId);
    return Networks.isNativeAsset(asset, network);
  }

  isNativeAddress(address: string | null, chainId: ChainId): boolean {
    const network = this.getNetworkById(chainId);
    if (!network.native_asset) {
      throw new Error(`Native asset is not defined for: ${chainId}`);
    }
    return network.native_asset
      ? address === network.native_asset.address
      : false;
  }

  static getNetworkRpcUrlInternal(network: NetworkConfig) {
    const url =
      network.rpc_url_user ||
      network.rpc_url_internal ||
      network.rpc_url_public?.[0];
    if (!url) {
      throw new Error(`Network url missing: ${network.id}`);
    }
    return url;
  }

  getRpcUrlInternal(chain: Chain) {
    const network = this.getByNetworkId(chain);
    if (!network) {
      throw new Error(`Cannot find network: ${chain}`);
    }
    return Networks.getNetworkRpcUrlInternal(network);
  }

  static getRpcUrlPublic(network: NetworkConfig) {
    const url =
      network.rpc_url_user ||
      network.rpc_url_public?.[0] ||
      network.rpc_url_internal;
    if (!url) {
      throw new Error(`Network url missing: ${network.id}`);
    }
    return url;
  }

  getRpcUrlPublic(chain: Chain) {
    const network = this.getByNetworkId(chain);
    if (!network) {
      throw new Error(`Cannot find network: ${chain}`);
    }
    return Networks.getRpcUrlPublic(network);
  }

  hasMatchingConfig(config: AddEthereumChainParameter) {
    /**
     * Checks whether a network config for this chainId already exists
     * and its RPC_URL value is the same
     */
    const chainId = normalizeChainId(config.chainId);
    if (this.hasNetworkById(chainId)) {
      const network = this.getNetworkById(chainId);
      const currentRpcUrl = this.getRpcUrlInternal(createChain(network.id));
      return (
        new URL(currentRpcUrl).toString() ===
        new URL(config.rpcUrls[0]).toString()
      );
    } else {
      return false;
    }
  }
}
