import { createDomainHook } from 'defi-sdk';

export interface Token {
  amount: string;
  asset_code: string;
  boost_status: string;
  name: string;
}

export interface Boost {
  address: string;
  boost_expiration: null | string;
  boost_status: null | string;
  fee: number;
  tokens: null | Token[];
}

const namespace = 'address';
const scope = 'boost';

export const useAddressBoost = createDomainHook<
  { address: string },
  Boost,
  typeof namespace,
  typeof scope
>({ namespace, scope });
