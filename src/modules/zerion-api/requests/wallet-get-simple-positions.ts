import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { Fungible } from '../types/Fungible';
import type { Amount } from '../types/Amount';
import { getConfidentialPermitsHeaders } from '../shared/confidentialPermitsHeader';
import type { SignedPermit } from './wallet-prepare-permits';

export interface Params {
  address: string;
  currency: string;
  /**
   * Signed decryption permits unlocking confidential amounts. This is a GET,
   * so they travel in the `Zerion-Confidential-Permits` header as unpadded
   * base64url of the compact JSON array. Capped at 10; a rejected or expired
   * permit is a 401 for the whole request.
   */
  permits?: SignedPermit[];
}

type Chain = {
  id: string;
  /**
   * @description Name of the chain
   * @example Ethereum
   */
  name: string;
  /**
   * @description URL to the chain's icon
   * @example https://example.com/icon.png
   */
  iconUrl: string;
};

export type FungiblePosition = {
  /**
   * @description Unique identifier for the position
   * @example eth-ethereum-asset
   */
  id: string;
  amount: Amount;
  fungible: Fungible;
  chain: Chain;
};

interface Response {
  data: FungiblePosition[];
  meta: null;
  errors: null;
}

export async function walletGetSimplePositions(
  this: ZerionApiContext,
  { address, currency, permits }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const provider = await this.getAddressProviderHeader(address);
  const kyOptions = this.getKyOptions();
  const params = new URLSearchParams({ address, currency });
  const endpoint = `wallet/get-simple-positions/v1?${params}`;
  return ZerionHttpClient.get<Response>(
    {
      endpoint,
      headers: {
        'Zerion-Wallet-Provider': provider,
        ...getConfidentialPermitsHeaders(permits),
      },
      ...options,
    },
    kyOptions
  );
}
