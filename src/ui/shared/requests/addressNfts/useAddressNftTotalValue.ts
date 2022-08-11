import { AddressParams, createDomainHook } from 'defi-sdk';

type ValuePreferenceType = 'floor_price' | 'last_price';

type Payload = AddressParams & {
  currency: string;
  value_type: ValuePreferenceType;
};

type Result = string;

const namespace = 'address';
const scope = 'nft-total-value';

export const useAddressNftTotalValue = createDomainHook<
  Payload,
  Result,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});
