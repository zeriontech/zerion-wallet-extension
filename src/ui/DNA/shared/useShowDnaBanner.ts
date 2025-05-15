import { useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { usePreferences } from 'src/ui/features/preferences';
import { useAddressMembership } from 'src/ui/shared/requests/useAddressMembership';
import { useAddressNFTCollectionStats } from 'src/ui/shared/requests/addressNfts/useAddressNftCollectionStats';
import { DNA_COLLECTION_ID, DNA_NFT_COLLECTION_ADDRESS } from './constants';

export function useShowDnaMintBanner(address: string) {
  const { value } = useAddressNFTCollectionStats({
    address,
    currency: 'usd',
    sorted_by: 'created_recently',
  });

  const localTransactions = useLocalAddressTransactions({ address });

  return useMemo(
    () =>
      value &&
      !value.some(
        (item) => item.collection.id.toString() === DNA_COLLECTION_ID
      ) &&
      !localTransactions.some(
        (item) =>
          normalizeAddress(item.transaction?.to || '') ===
          DNA_NFT_COLLECTION_ADDRESS
      ),
    [value, localTransactions]
  );
}

const DNA_BACKGROUND_PERK = 'extensionBackground';

export function useAddressHasDnaUpgradeBackgroundPerk(address: string) {
  const { value, isLoading } = useAddressNfts(
    {
      address,
      currency: 'usd',
      sorted_by: 'created_recently',
      collection_ids: [DNA_COLLECTION_ID],
    },
    { limit: 10 }
  );

  const { value: membershipInfo } = useAddressMembership(
    { address },
    { cachePolicy: 'network-only' }
  );

  return (
    !isLoading &&
    value?.length &&
    membershipInfo?.claimable_perks?.includes(DNA_BACKGROUND_PERK)
  );
}

export function useShowNftTabDnaBanner(address: string) {
  const { preferences } = usePreferences();
  const shouldShowMintBanner = useShowDnaMintBanner(address);

  return shouldShowMintBanner && preferences?.mintDnaBannerDismissed;
}
