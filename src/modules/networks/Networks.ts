import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { capitalize } from 'capitalize-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { ChainConfig } from 'src/modules/ethereum/chains/ChainConfigStore';
import type { Chain } from './Chain';
import { createChain } from './Chain';
import type { NetworkConfig } from './NetworkConfig';
import { applyKeyToEndpoint, keys as defaultKeys } from './keys';
import type { Keys } from './keys';
import type { TransactionPurpose } from './TransactionPurpose';
import { getAddress } from './asset';
import { UnsupportedNetwork } from './errors';

type Collection<T> = { [key: string]: T };

function toCollection<T, K>(
  items: T[],
  getKey: (item: T) => string,
  getItem: (item: T) => K
) {
  const result: Collection<ReturnType<typeof getItem>> = {};
  for (const item of items) {
    result[getKey(item)] = getItem(item);
  }
  return result;
}

function localeCompareWithPriority(
  str1: string,
  str2: string,
  priorityString?: string
) {
  if (priorityString) {
    if (str1 === priorityString) {
      return -1;
    }
    if (str2 === priorityString) {
      return 1;
    }
  }
  return str1.localeCompare(str2);
}

export type EthereumChainSources = Record<string, ChainConfig>;

type EthereumChainSourcesNormalized = Collection<
  undefined | { items: NetworkConfig[]; collection: Collection<NetworkConfig> }
>;

export interface NetworkConfigMetaData {
  created: number;
  updated: number;
  origin: string;
}

function normalizeSources(
  sources: EthereumChainSources | undefined
): EthereumChainSourcesNormalized {
  if (!sources) {
    return {};
  }
  const ethereumChainSourcesNormalized: EthereumChainSourcesNormalized = {};
  for (const [key, value] of Object.entries(sources)) {
    const networkConfigs = value.ethereumChains.map((x) => x.value);
    ethereumChainSourcesNormalized[key] = {
      items: networkConfigs,
      collection: toCollection(
        networkConfigs,
        (item) => item.chain,
        (x) => x
      ),
    };
  }
  return ethereumChainSourcesNormalized;
}

export class Networks {
  private networks: NetworkConfig[];
  ethereumChainSources?: EthereumChainSources;
  private sourcesNormalized?: EthereumChainSourcesNormalized;
  private keys: Keys;
  private collection: { [key: string]: NetworkConfig | undefined };
  private collectionByEvmId: { [key: string]: NetworkConfig | undefined };
  private originalCollection: { [key: string]: NetworkConfig | undefined };
  private supportedByBackend: Set<string>;
  static purposeKeyMap = {
    sending: 'supports_sending',
    trading: 'supports_trading',
    bridge: 'supports_bridge',
  } as const;

  constructor({
    networks,
    keys = defaultKeys,
    ethereumChainSources,
  }: {
    networks: NetworkConfig[];
    ethereumChainSources?: EthereumChainSources;
    keys?: Keys;
  }) {
    this.networks = networks.sort((a, b) =>
      localeCompareWithPriority(a.name, b.name, 'Ethereum')
    );
    this.ethereumChainSources = ethereumChainSources;
    this.keys = keys;
    const {
      collection,
      originalCollection,
      collectionByEvmId,
      sourcesNormalized,
    } = this.prepare();
    this.collection = collection;
    this.originalCollection = originalCollection;
    this.collectionByEvmId = collectionByEvmId;
    this.sourcesNormalized = sourcesNormalized;
    this.supportedByBackend = new Set(networks.map((n) => n.chain));
  }

  private prepare() {
    const originalCollection = toCollection(
      this.networks,
      (network) => network.chain,
      (x) => x
    );
    const collectionByEvmId = toCollection(
      this.networks,
      (x) => x.external_id,
      (x) => x
    );
    const sourcesNormalized = normalizeSources(this.ethereumChainSources);
    const collection = { ...originalCollection };
    for (const value of Object.values(sourcesNormalized)) {
      if (!value) {
        continue;
      }
      Object.assign(collection, value.collection);
      Object.assign(
        collectionByEvmId,
        toCollection(
          value.items,
          (item) => item.external_id,
          (item) => item
        )
      );
    }
    return {
      collection,
      originalCollection,
      collectionByEvmId,
      sourcesNormalized,
    };
  }

  updateEthereumChainSources(ethereumChainSources: EthereumChainSources) {
    this.ethereumChainSources = ethereumChainSources;
    const {
      collection,
      collectionByEvmId,
      originalCollection,
      sourcesNormalized,
    } = this.prepare();
    this.collection = collection;
    this.originalCollection = originalCollection;
    this.collectionByEvmId = collectionByEvmId;
    this.sourcesNormalized = sourcesNormalized;
  }

  static getName(network: NetworkConfig) {
    return network.name || capitalize(network.chain);
  }

  private toId(chain: Chain) {
    const item = this.collection[chain.toString()];
    if (!item) {
      throw new Error(`Chain not found: ${chain}`);
    }
    return item.external_id;
  }

  getNetworks() {
    return this.networks;
  }

  getAllNetworks() {
    return Object.values(this.collection).filter(isTruthy);
  }

  getMainnets() {
    const customCollection = this.sourcesNormalized?.['custom']?.collection;
    return this.networks.map(
      (network) => customCollection?.[network.chain] || network
    );
  }

  getNetworksMetaData(): Record<string, NetworkConfigMetaData | undefined> {
    const result: Record<string, NetworkConfigMetaData> = {};
    const values = ['predefined', 'custom']
      .map((key) => this.ethereumChainSources?.[key])
      .filter(isTruthy);
    for (const value of values) {
      for (const config of value.ethereumChains) {
        if (result[config.value.chain]) {
          // do not overwrite "created" field
          result[config.value.chain].updated = config.updated;
          result[config.value.chain].origin = config.origin;
        } else {
          const created = this.originalCollection[config.value.chain]
            ? 0
            : config.created;
          result[config.value.chain] = {
            created: created,
            updated: config.updated,
            origin: config.origin,
          };
        }
      }
    }
    return result;
  }

  getTestNetworks() {
    const customCollection = this.sourcesNormalized?.['custom']?.collection;
    const items = this.sourcesNormalized?.['predefined']?.items || [];
    return items.map((item) => {
      return customCollection?.[item.chain] || item;
    });
  }

  getCustomNetworks() {
    const predefinedCollection =
      this.sourcesNormalized?.['predefined']?.collection || {};
    const items = this.sourcesNormalized?.['custom']?.items || [];
    return items.filter(
      (item) =>
        item.chain in predefinedCollection === false &&
        item.chain in this.originalCollection === false
    );
  }

  getSourceType(chain: Chain): 'mainnets' | 'testnets' | 'custom' {
    const chainStr = chain.toString();
    if (chainStr in this.originalCollection) {
      return 'mainnets';
    } else if (
      this.sourcesNormalized?.['predefined'] &&
      chainStr in this.sourcesNormalized['predefined'].collection
    ) {
      return 'testnets';
    } else if (
      this.sourcesNormalized?.['custom'] &&
      chainStr in this.sourcesNormalized['custom'].collection
    ) {
      return 'custom';
    }
    return 'custom';
  }

  findEthereumChainById(chainId: string) {
    const find = (id: string, config?: ChainConfig) =>
      config?.ethereumChains?.find((item) => item.value.external_id === id);
    return (
      find(chainId, this.ethereumChainSources?.['predefined']) ||
      find(chainId, this.ethereumChainSources?.['custom'])
    );
  }

  isSupportedByBackend(chain: Chain) {
    return this.supportedByBackend.has(chain.toString());
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
    return this.collection[chain.toString()]?.name || capitalize(String(chain));
  }

  getNetworkById(chainId: string) {
    const network = this.collectionByEvmId[chainId];
    if (!network) {
      throw new UnsupportedNetwork(`Unsupported network id: ${chainId}`);
    }
    return network;
  }

  hasNetworkById(chainId: string) {
    return Boolean(this.collectionByEvmId[chainId]);
  }

  getNetworkByName(chain: Chain) {
    return this.collection[chain.toString()];
  }

  getChainById(chainId: string): Chain {
    const network = this.getNetworkById(chainId);
    return createChain(network.chain);
  }

  getChainNameById(chainId: string) {
    const network = this.getNetworkById(chainId);
    return this.getChainName(createChain(network.chain));
  }

  getExplorerHomeUrlByName(chain: Chain) {
    return this.collection[chain.toString()]?.explorer_home_url;
  }

  private getExplorerTxUrl(network: NetworkConfig | undefined, hash: string) {
    if (network?.explorer_tx_url) {
      return network.explorer_tx_url?.replace('{HASH}', hash);
    } else if (network?.explorer_home_url) {
      return new URL(`/tx/${hash}`, network?.explorer_home_url).toString();
    }
  }

  getExplorerTxUrlById(chainId: string, hash: string) {
    return this.getExplorerTxUrl(this.collectionByEvmId[chainId], hash);
  }

  getExplorerTxUrlByName(chain: Chain, hash: string) {
    return this.getExplorerTxUrl(this.collection[chain.toString()], hash);
  }

  getExplorerAddressUrlByName(chain: Chain, address: string) {
    return this.getExplorerAddressUrl(
      this.collection[chain.toString()],
      address
    );
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

  getExplorerTokenUrlById(chainId: string, address: string) {
    return this.getExplorerTokenUrl(this.collection[chainId], address);
  }

  getExplorerTokenUrlByName(chain: Chain, address: string) {
    return this.getExplorerTokenUrl(this.collection[chain.toString()], address);
  }

  getExplorerNameById(chainId: string) {
    return this.collectionByEvmId[chainId]?.explorer_name;
  }

  getEthereumChainParameter(chainId: string): AddEthereumChainParameter {
    const network = this.collectionByEvmId[chainId];
    if (!network || !network.rpc_url_public || !network.native_asset) {
      throw new UnsupportedNetwork(`Unsupported network id: ${chainId}`);
    }
    return {
      chainId,
      rpcUrls: network.rpc_url_public,
      chainName: network.name,
      nativeCurrency: {
        // code: network.native_asset.address,
        name: network.native_asset.name,
        symbol: network.native_asset.symbol,
        decimals: network.native_asset.decimals as 18, // ¯\_(ツ)_/¯
      },
      iconUrls: [network.icon_url],
      blockExplorerUrls: network.explorer_home_url
        ? [network.explorer_home_url]
        : [],
    };
  }

  supports(purpose: TransactionPurpose, chain: Chain): boolean {
    const network = this.getNetworkByName(chain);
    if (!network) {
      return false;
    }
    const key = Networks.purposeKeyMap[purpose];
    return network[key];
  }

  isNativeAsset(asset: Asset, chainId: string): boolean {
    const network = this.getNetworkById(chainId);
    return network.native_asset
      ? getAddress({ asset, chain: createChain(network.chain) }) ===
          network.native_asset.address
      : false;
  }

  isNativeAddress(address: string | null, chainId: string): boolean {
    const network = this.getNetworkById(chainId);
    if (!network.native_asset) {
      throw new Error(`Native asset is not defined for: ${chainId}`);
    }
    return network.native_asset
      ? address === network.native_asset.address
      : false;
  }

  getRpcUrlInternal(chain: Chain) {
    const network = this.getNetworkByName(chain);
    if (!network) {
      throw new Error(`Cannot find network: ${chain}`);
    }
    const url =
      network.rpc_url_user ||
      network.rpc_url_internal ||
      network.rpc_url_public?.[0];
    if (!url) {
      throw new Error(`Network url missing: ${chain}`);
    }
    return applyKeyToEndpoint(url, this.keys);
  }

  getRpcUrlPublic(chain: Chain) {
    const network = this.getNetworkByName(chain);
    if (!network) {
      throw new Error(`Cannot find network: ${chain}`);
    }
    const url =
      network.rpc_url_user ||
      network.rpc_url_public?.[0] ||
      network.rpc_url_internal;
    if (!url) {
      throw new Error(`Network url missing: ${chain}`);
    }
    return applyKeyToEndpoint(url, this.keys);
  }
}
