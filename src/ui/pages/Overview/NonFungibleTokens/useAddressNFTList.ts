import { useMemo } from 'react';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNftsWithDna';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';

export const DNA_NFT_COLLECTION_ADDRESS =
  '0x932261f9fc8da46c4a22e31b45c4de60623848bf';

export function useAddressNFTList() {
  const { ready, params } = useAddressParams();

  const { isLoading, value: allItems } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
    },
    { enabled: ready }
  );

  const { value: dnaCollectionItems, isLoading: dnaIsLoading } = useAddressNfts(
    {
      ...params,
      currency: 'usd',
      contract_addresses: [DNA_NFT_COLLECTION_ADDRESS],
    },
    { enabled: ready }
  );

  const items = useMemo(() => {
    return [
      ...(dnaCollectionItems || []),
      ...(allItems?.filter(
        (item) => item.asset.contract_address !== DNA_NFT_COLLECTION_ADDRESS
      ) || []),
    ];
  }, [allItems, dnaCollectionItems]);

  return { value: items, isLoading: isLoading || dnaIsLoading };
}
