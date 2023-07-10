import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import type { NFT } from 'src/ui/shared/requests/addressNfts/types';
import { getNftId } from 'src/ui/shared/requests/addressNfts/getNftId';
import { NFTItem } from 'src/ui/pages/Overview/NonFungibleTokens/NFTItem';
import * as styles from './styles.module.css';

export type SelectableNFT = Pick<
  NFT,
  'contract_address' | 'chain' | 'token_id'
>;

export function NFTSelector({
  address,
  defaultValue,
  onSubmit,
  onDismiss,
}: {
  address: string;
  defaultValue?: SelectableNFT | null;
  onSubmit(value: SelectableNFT | null): void;
  onDismiss?(): void;
}) {
  const { value: items, isLoading } = useAddressNfts(
    {
      address,
      currency: 'usd',
      sorted_by: 'floor_price_high',
    },
    { limit: 30, paginatedCacheMode: 'first-page' }
  );

  if (isLoading) {
    return <CircleSpinner />;
  }

  if (!items?.length) {
    return (
      <VStack gap={32}>
        <UIText
          kind="body/regular"
          color="var(--neutral-500)"
          style={{ textAlign: 'center' }}
        >
          No nfts
        </UIText>
      </VStack>
    );
  }

  return (
    <form
      method="dialog"
      style={{ position: 'relative' }}
      onSubmit={(event) => {
        event.preventDefault();
        const selectedNFT = new FormData(event.currentTarget).get(
          'nft'
        ) as string;
        if (selectedNFT) {
          const [chain, contract_address, token_id] = selectedNFT.split(':');
          onSubmit({ chain, contract_address, token_id });
        }
        onSubmit(null);
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          gridGap: 12,
          paddingInline: 18,
          minHeight: 'calc(100vh - 164px)',
          alignItems: 'baseline',
        }}
      >
        {items.map((addressNft) => (
          <div key={getNftId(addressNft)} style={{ display: 'flex' }}>
            <input
              className={styles.radio}
              type="radio"
              name="nft"
              id={`nft-${getNftId(addressNft)}`}
              value={getNftId(addressNft)}
              style={{ width: 0, height: 0 }}
              defaultChecked={Boolean(
                defaultValue && getNftId(defaultValue) === getNftId(addressNft)
              )}
            />
            <label
              htmlFor={`nft-${getNftId(addressNft)}`}
              className={styles.nft}
            >
              <NFTItem item={addressNft} showCollection={true} />
              <CheckIcon className={styles.check} />
            </label>
          </div>
        ))}
      </div>

      <HStack
        gap={8}
        style={{
          position: 'sticky',
          bottom: 0,
          left: -24,
          right: -24,
          zIndex: 2,
          padding: '24px 16px',
          backgroundColor: 'var(--z-index-1)',
          gridTemplateColumns: '1fr 1fr',
        }}
        alignItems="center"
        justifyContent="center"
      >
        <Button kind="regular" type="button" onClick={onDismiss}>
          Cancel
        </Button>
        <Button kind="primary" type="submit">
          Confirm
        </Button>
      </HStack>
    </form>
  );
}
