import React from 'react';
import { NFTItem } from 'src/ui/pages/Overview/NonFungibleTokens/NFTItem';
import { useAddressNFTList } from 'src/ui/pages/Overview/NonFungibleTokens/useAddressNFTList';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check_circle.svg';
import * as styles from './styles.module.css';

export function NFTSelector({
  defaultValue,
  onSubmit,
  onDismiss,
}: {
  defaultValue?: string;
  onSubmit?(value: string): void;
  onDismiss?(): void;
}) {
  const { value: items, isLoading } = useAddressNFTList();

  if (isLoading) {
    return <CircleSpinner />;
  }

  if (items.length === 0) {
    return (
      <VStack gap={32}>
        <UIText
          kind="subtitle/l_reg"
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
        const selectedNFT = new FormData(event.currentTarget).get('nft');
        onSubmit?.(selectedNFT as string);
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          gridGap: 12,
          padding: '0 2px',
          minHeight: 'calc(100vh - 164px)',
          alignItems: 'baseline',
        }}
      >
        {items.map((addressNft) => (
          <div key={addressNft.id} style={{ display: 'flex' }}>
            <input
              className={styles.radio}
              type="radio"
              name="nft"
              id={`nft-${addressNft.id}`}
              value={addressNft.asset.asset_code}
              style={{ width: 0, height: 0 }}
              defaultChecked={defaultValue === addressNft.asset.asset_code}
            />
            <label htmlFor={`nft-${addressNft.id}`} className={styles.nft}>
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
          left: 0,
          right: 0,
          zIndex: 2,
          padding: '24px 16px',
          backgroundColor: 'var(--z-index-1)',
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
