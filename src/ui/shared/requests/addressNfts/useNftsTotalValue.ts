import type { AddressParams } from 'defi-sdk';
import { createDomainHook } from 'defi-sdk';
import { useMemo } from 'react';

interface NFTPortfolioDecomposition {
  floor_price: Record<string, number>;
}

type Payload = AddressParams & {
  currency: string;
};

const namespace = 'address';
const scope = 'nft-portfolio-decomposition';

export const useAddressNFTDistribution = createDomainHook<
  Payload,
  NFTPortfolioDecomposition,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});

export function useNftsTotalValue(addressParams: AddressParams) {
  const data = useAddressNFTDistribution({
    ...addressParams,
    currency: 'usd',
  });

  const nftsTotalValue = useMemo(() => {
    if (!data.value) {
      return null;
    }
    return Object.values(data.value?.floor_price).reduce(
      (acc, item) => acc + item,
      0
    );
  }, [data.value]);

  return { ...data, value: nftsTotalValue };
}
