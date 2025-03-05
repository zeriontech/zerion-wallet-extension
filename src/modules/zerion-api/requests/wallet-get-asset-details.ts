import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  assetId: string;
  addresses: string[];
  currency: string;
  groupBy: ('by-wallet' | 'by-app')[];
  addPnl?: boolean;
}

interface NetworkShortInfo {
  id: string;
  name: string;
  iconUrl: string;
  testnet: boolean;
}

export interface WalletAssetDetails {
  chainsDistribution: {
    chain: NetworkShortInfo;
    value: number;
    percentageAllocation: number;
  }[];
  wallets: {
    wallet: {
      name: string;
      iconUrl: string;
      premium: boolean;
      address: string;
    };
    chains: NetworkShortInfo[];
    value: number;
    convertedQuantity: number;
    percentageAllocation: number;
  }[];
  apps: {
    app: {
      id: string;
      name: string;
      iconUrl: string | null;
      url: string | null;
    };
    chains: NetworkShortInfo[];
    value: number;
    convertedQuantity: number;
    percentageAllocation: number;
  }[];
  pnl: null;
  totalValue: number;
  totalConvertedQuantity: number;
}

type Response = ResponseBody<WalletAssetDetails>;

export async function walletGetAssetDetails(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/get-asset-details/v1',
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}
