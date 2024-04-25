import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { capitalize } from 'capitalize-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/ChainConfigStore';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { ChainId } from '../ethereum/transactions/ChainId';
import type { Chain } from './Chain';
import { createChain } from './Chain';
import type { NetworkConfig } from './NetworkConfig';
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
    injectChainConfig(network, chainConfigById[network.id])
  );
}

export interface NetworkConfigMetaData {
  created: number;
  updated: number;
  origin: string;
}

export class Networks {
  private networks: NetworkConfig[];
  private collection: { [key: string]: NetworkConfig | undefined };
  private collectionByEvmId: { [key: ChainId]: NetworkConfig | undefined };
  private ethereumChainConfigs: EthereumChainConfig[];

  static getChainId(network: NetworkConfig) {
    return network.standard === 'eip155'
      ? normalizeChainId(network.specification.eip155.id)
      : null;
  }

  constructor({
    networks,
    ethereumChainConfigs,
  }: {
    networks: NetworkConfig[];
    ethereumChainConfigs: EthereumChainConfig[];
  }) {
    this.ethereumChainConfigs = ethereumChainConfigs;
    this.networks = injectChainConfigs(networks, ethereumChainConfigs);
    this.collection = toCollection(
      this.networks,
      (network) => network.id,
      (x) => x
    );
    this.collectionByEvmId = toCollection(
      this.networks,
      (x) => Networks.getChainId(x),
      (x) => x
    );
  }

  static getName(network: NetworkConfig) {
    return network.name || capitalize(network.id);
  }

  private toId(chain: Chain) {
    const item = this.collection[chain.toString()];
    if (!item) {
      throw new Error(`Chain not found: ${chain}`);
    }
    return Networks.getChainId(item);
  }

  isSavedLocallyChain(chain: Chain) {
    return this.ethereumChainConfigs.some(
      (item) => item.id === chain.toString()
    );
  }

  getNetworks() {
    return this.networks;
  }

  getMainnets() {
    return this.networks.filter((item) => !item.is_testnet);
  }

  getNetworksMetaData(): Record<string, NetworkConfigMetaData | undefined> {
    return Object.fromEntries(
      this.ethereumChainConfigs.map((chainConfig) => [
        chainConfig.id,
        chainConfig,
      ])
    );
  }

  getTestNetworks() {
    return this.networks.filter((item) => item.is_testnet);
  }

  findEthereumChainById(chainId: ChainId) {
    return this.collectionByEvmId[chainId];
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

  getNetworkByName(chain: Chain) {
    return this.collection[chain.toString()];
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
    return this.collection[chain.toString()]?.explorer_home_url;
  }

  private getExplorerTxUrl(network: NetworkConfig | undefined, hash: string) {
    if (network?.explorer_tx_url) {
      return network.explorer_tx_url?.replace('{HASH}', hash);
    } else if (network?.explorer_home_url) {
      return new URL(`/tx/${hash}`, network?.explorer_home_url).toString();
    }
  }

  getExplorerTxUrlById(chainId: ChainId, hash: string) {
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

  getExplorerTokenUrlById(chainId: ChainId, address: string) {
    return this.getExplorerTokenUrl(this.collection[chainId], address);
  }

  getExplorerTokenUrlByName(chain: Chain, address: string) {
    return this.getExplorerTokenUrl(this.collection[chain.toString()], address);
  }

  getExplorerNameByName(chain: Chain) {
    return this.collection[chain.toString()]?.explorer_name;
  }

  // TODO: this method is not used. Should we remove it?
  getEthereumChainParameter(chainId: ChainId): AddEthereumChainParameter {
    const network = this.collectionByEvmId[chainId];
    if (!network || !network.rpc_url_public || !network.native_asset) {
      throw new UnsupportedNetwork(`Unsupported network id: ${chainId}`);
    }
    return {
      chainId,
      rpcUrls: network.rpc_url_public,
      chainName: network.name,
      nativeCurrency: {
        name: network.native_asset.name,
        symbol: network.native_asset.symbol,
        decimals: network.native_asset.decimals,
      },
      iconUrls: [network.icon_url],
      blockExplorerUrls: network.explorer_home_url
        ? [network.explorer_home_url]
        : [],
    };
  }

  supports(purpose: SupportsFlags, chain: Chain): boolean {
    const network = this.getNetworkByName(chain);
    if (!network) {
      return false;
    }
    return network[`supports_${purpose}`];
  }

  isNativeAsset(asset: Asset, chainId: ChainId): boolean {
    const network = this.getNetworkById(chainId);
    return network.native_asset
      ? getAddress({ asset, chain: createChain(network.id) }) ===
          network.native_asset.address
      : false;
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
    const network = this.getNetworkByName(chain);
    if (!network) {
      throw new Error(`Cannot find network: ${chain}`);
    }
    return Networks.getNetworkRpcUrlInternal(network);
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
    return url;
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
