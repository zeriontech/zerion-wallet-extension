import type { Asset } from 'src/defi-sdk.types';
import { isTruthy } from 'is-truthy-ts';
import { capitalize } from 'capitalize-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/types';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { FEATURE_SOLANA } from 'src/env/config';
import type { ChainFlags } from 'src/modules/zerion-api/types/ChainFullInfo';
import type { ChainId } from '../ethereum/transactions/ChainId';
import type { Chain } from './Chain';
import { createChain } from './Chain';
import type { NetworkInfo, NetworkInfoEip155 } from './NetworkInfo';
import { getBaseAssetImplementation } from './NetworkInfo';
import { getAddress } from './asset';
import { UnsupportedNetwork } from './errors';
import { applyChainConfig } from './applyChainConfig';

type Collection<T> = { [key: string]: T };

/** Purpose vocabulary of {Networks.supports}: `'trading'` reads `flags.supportsTrading` */
type SupportsFlags = keyof {
  [K in keyof ChainFlags as K extends `supports${infer S}`
    ? Uncapitalize<S>
    : never]: ChainFlags[K];
};

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

function applyChainConfigs(
  networks: NetworkInfo[],
  chainConfigs: EthereumChainConfig[]
): NetworkInfo[] {
  const chainConfigById = Object.fromEntries(
    chainConfigs.map((config) => [config.id, config.value])
  );
  return networks.map((network) =>
    applyChainConfig(network, chainConfigById[network.id] || null)
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
  private networks: NetworkInfo[];
  private collection: { [key: string]: NetworkInfo | undefined };
  private collectionByEvmId: { [key: ChainId]: NetworkInfo | undefined };
  private networkIdAliases: Record<string, string>;
  private ethereumChainConfigs: EthereumChainConfig[];
  private visitedChains: Set<string>;

  private solanaNetworks: NetworkInfo[];
  private evmNetworks: NetworkInfo[];

  /** Hex chain id; ZPI's `specification.eip155.chainId` is decimal */
  static getChainId<T extends Partial<NetworkInfo>>(network: T) {
    if (Networks.isEip155(network)) {
      return normalizeChainId(network.specification.eip155.chainId);
    }
    throw new Error(`Network is not eip-155: ${network.id}`);
  }

  static isEip155<T extends Partial<NetworkInfo>>(
    network: T
  ): network is T & NetworkInfoEip155 {
    return network.specification?.eip155 != null;
  }

  static getEcosystem(network: NetworkInfo): BlockchainType {
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

  static predicate(standard: BlockchainType | null, network: NetworkInfo) {
    if (standard === 'solana') {
      return network.specification.solana != null;
    } else if (standard === 'evm') {
      return Networks.isEip155(network);
    } else {
      return true;
    }
  }

  /**
   * Update this predicate when adding new supported ecosystems
   */
  static isSupportedEcosystem(network: NetworkInfo) {
    return Networks.isEip155(network) || network.id === 'solana';
  }

  constructor({
    networks,
    ethereumChainConfigs,
    visitedChains,
  }: {
    networks: NetworkInfo[];
    ethereumChainConfigs: EthereumChainConfig[];
    visitedChains: string[];
  }) {
    this.ethereumChainConfigs = ethereumChainConfigs;
    this.networks = applyChainConfigs(networks, ethereumChainConfigs);
    this.networks = this.networks.filter(Networks.isSupportedEcosystem);
    if (FEATURE_SOLANA !== 'on') {
      this.networks = this.networks.filter((n) => Networks.isEip155(n));
    }
    this.evmNetworks = this.networks.filter((n) => Networks.isEip155(n));
    this.solanaNetworks = this.networks.filter(
      (n) => n.specification.solana != null
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

  static getName(network: NetworkInfo) {
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
    return this.networks.filter((item) => !item.testnet);
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
      .filter((network) => network.flags.supportsTrading && network.baseAsset)
      .map((network) => network.baseAsset?.id)
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
    return this.getByNetworkId(chain)?.explorer?.homeUrl;
  }

  private getExplorerTxUrl(network: NetworkInfo | undefined, hash: string) {
    return network?.explorer?.txUrl.replace('{HASH}', hash);
  }

  getExplorerTxUrlById(chainId: ChainId, hash: string) {
    return this.getExplorerTxUrl(this.collectionByEvmId[chainId], hash);
  }

  getExplorerTxUrlByName(chain: Chain, hash: string) {
    return this.getExplorerTxUrl(this.getByNetworkId(chain), hash);
  }

  getExplorerAddressUrlByName(chain: Chain, address: string) {
    return Networks.getExplorerAddressUrl(this.getByNetworkId(chain), address);
  }

  static getExplorerAddressUrl(
    network: NetworkInfo | undefined,
    address: string
  ) {
    return network?.explorer?.addressUrl.replace('{ADDRESS}', address);
  }

  private getExplorerTokenUrl(
    network: NetworkInfo | undefined,
    address: string
  ) {
    return network?.explorer?.tokenUrl.replace('{ADDRESS}', address);
  }

  getExplorerTokenUrlByName(chain: Chain, address: string) {
    return this.getExplorerTokenUrl(this.getByNetworkId(chain), address);
  }

  getExplorerNameByChainName(chain: Chain) {
    return this.getByNetworkId(chain)?.explorer?.name;
  }

  static supports(purpose: SupportsFlags, network: NetworkInfo): boolean {
    const key = `supports${capitalize(purpose)}` as keyof ChainFlags;
    return Boolean(network.flags[key]);
  }

  supports(purpose: SupportsFlags, chain: Chain): boolean {
    const network = this.getByNetworkId(chain);
    if (!network) {
      return false;
    }
    return Networks.supports(purpose, network);
  }

  static isNativeAsset(asset: Asset, network: NetworkInfo) {
    const implementation = getBaseAssetImplementation(network);
    if (implementation) {
      const address = getAddress({ asset, chain: createChain(network.id) });
      return address === implementation.address;
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
    const implementation = getBaseAssetImplementation(network);
    if (!implementation) {
      throw new Error(`Native asset is not defined for: ${chainId}`);
    }
    return address === implementation.address;
  }

  static getNetworkRpcUrlInternal(network: NetworkInfo) {
    const url = network.rpcUrlUser || network.rpcUrl || network.publicRpcUrl;
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

  static getRpcUrlPublic(network: NetworkInfo) {
    const url = network.rpcUrlUser || network.publicRpcUrl || network.rpcUrl;
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
