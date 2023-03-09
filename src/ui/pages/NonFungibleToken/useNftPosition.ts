import { createDomainHook } from 'defi-sdk';
import type { AddressParams } from 'defi-sdk';
import type { AddressNFT } from 'src/ui/shared/requests/addressNfts/types';

type Payload = AddressParams & {
  currency: string;
  chain: string;
  contract_address: string;
  token_id: string;
};

const namespace = 'address';
const scope = 'nft-position';

export const useNFTPosition = createDomainHook<
  Payload,
  AddressNFT,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});
