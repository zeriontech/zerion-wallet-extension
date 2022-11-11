import type { Asset } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { capitalize } from 'capitalize-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { Chain } from './Chain';
import { createChain } from './Chain';
import { NetworkConfig } from './NetworkConfig';
import { applyKeyToEndpoint, keys as defaultKeys } from './keys';
import type { Keys } from './keys';
import type { TransactionPurpose } from './TransactionPurpose';
import { getAddress } from './asset';

function toCollection<T, K>(
  items: T[],
  getKey: (item: T) => string,
  getItem: (item: T) => K
) {
  const result: { [key: string]: ReturnType<typeof getItem> } = {};
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

export class Networks {
  private networks: NetworkConfig[];
  private keys: Keys;
  private collection: { [key: string]: NetworkConfig | undefined };
  private nameToId: { [key: string]: string };
  static purposeKeyMap = {
    sending: 'supports_sending',
    trading: 'supports_trading',
    bridge: 'supports_bridge',
  } as const;

  constructor({
    networks,
    keys = defaultKeys,
  }: {
    networks: NetworkConfig[];
    keys?: Keys;
  }) {
    this.networks = networks.sort((a, b) =>
      localeCompareWithPriority(a.name, b.name, 'Ethereum')
    );
    this.keys = keys;
    this.collection = toCollection(
      this.networks,
      (network) => network.external_id,
      (x) => x
    );
    this.nameToId = toCollection(
      this.networks,
      (networks) => networks.chain,
      (network) => network.external_id
    );
  }

  static getName(network: NetworkConfig) {
    return network.name || capitalize(network.chain);
  }

  private toId(chain: Chain) {
    return this.nameToId[chain.toString()];
  }

  getNetworks() {
    return this.networks;
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
    return this.collection[this.toId(chain)]?.name || capitalize(String(chain));
  }

  getNetworkById(chainId: string) {
    const network = this.collection[chainId];
    if (!network) {
      throw new Error(`Unsupported network id: ${chainId}`);
    }
    return network;
  }

  getNetworkByName(chain: Chain) {
    return this.collection[this.toId(chain)];
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
    return this.collection[this.toId(chain)]?.explorer_home_url;
  }

  private getExplorerTxUrl(network: NetworkConfig | undefined, hash: string) {
    return network?.explorer_tx_url?.replace('{HASH}', hash);
  }

  getExplorerTxUrlById(chainId: string, hash: string) {
    return this.getExplorerTxUrl(this.collection[chainId], hash);
  }

  getExplorerTxUrlByName(chain: Chain, hash: string) {
    return this.getExplorerTxUrl(this.collection[this.toId(chain)], hash);
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
    return this.getExplorerTokenUrl(this.collection[this.toId(chain)], address);
  }

  getExplorerNameById(chainId: string) {
    return this.collection[chainId]?.explorer_name;
  }

  getEthereumChainParameter(chainId: string): AddEthereumChainParameter {
    const network = this.collection[chainId];
    if (!network || !network.rpc_url_public || !network.native_asset) {
      throw new Error(`Unsupported network id: ${chainId}`);
    }
    return {
      chainId,
      rpcUrls: network.rpc_url_public,
      chainName: network.name,
      nativeCurrency: {
        code: network.native_asset.address,
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
    if (!network.rpc_url_internal) {
      throw new Error(`Network url missing: ${chain}`);
    }
    return applyKeyToEndpoint(network.rpc_url_internal, this.keys);
  }
}
