import { createDomainHook } from 'defi-sdk';
import type { NFTInfo } from 'defi-sdk';

type Payload = {
  asset_code: string;
  currency: string;
};

const namespace = 'assets';
const scope = 'nft-info';

export const useNftInfo = createDomainHook<
  Payload,
  NFTInfo,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});
