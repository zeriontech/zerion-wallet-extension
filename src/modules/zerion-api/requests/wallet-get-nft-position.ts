import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { NftPosition } from './wallet-get-nft-positions';

export interface Params {
  address: string;
  currency: string;
  /** @description ZPI NFT id `${chain}:${contractAddress}:${tokenId}` */
  nftId: string;
}

interface Response {
  data: NftPosition;
  meta: null;
  errors: null;
}

export async function walletGetNftPosition(
  this: ZerionApiContext,
  { address, currency, nftId }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(address);
  const kyOptions = this.getKyOptions();
  const params = new URLSearchParams({ address, currency, nftId });
  const endpoint = `wallet/get-nft-position/v1?${params}`;
  return ZerionHttpClient.get<Response>(
    {
      endpoint,
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}
