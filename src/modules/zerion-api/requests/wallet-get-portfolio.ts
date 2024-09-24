import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ResponseBody } from './ResponseBody';
import { getAddressProviderHeader } from './shared';

export interface Params {
  addresses: string[];
  currency: string;
  nftPriceType?: 'not_included';
}

export interface WalletPortfolio {
  positionsTypesDistribution: {
    assets: number;
    deposited: number;
    borrowed: number;
    locked: number;
    staked: number;
  };
  positionsChainsDistribution: Record<string, number>;
  nfts: {
    lastPrice: number;
    floorPrice: number;
  };
  change24h: {
    absolute: number;
    relative: number;
  };
  totalValue: number;
  chains: Record<
    string,
    {
      id: string;
      explorerTxUrl: string | null;
      iconUrl: string | null;
      testnet: boolean;
      name: string;
    }
  >;
}

type Response = ResponseBody<WalletPortfolio>;

export async function walletGetPortfolio(
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const firstAddress = params.addresses[0];
  const provider = await getAddressProviderHeader(firstAddress);
  const endpoint = 'wallet/get-portfolio/v1';
  return ZerionHttpClient.post<Response>({
    endpoint,
    body: JSON.stringify(params),
    headers: { 'Zerion-Wallet-Provider': provider },
    ...options,
  });
}
