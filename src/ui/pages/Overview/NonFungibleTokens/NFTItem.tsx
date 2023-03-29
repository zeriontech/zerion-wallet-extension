import React, { useMemo } from 'react';
import TickIcon from 'jsx:src/ui/assets/check.svg';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AddressNFT } from 'src/ui/shared/requests/addressNfts/types';

export function NFTItem({
  item,
  showCollection = false,
  someHavePrice = false,
}: {
  item: AddressNFT;
  showCollection?: boolean;
  someHavePrice?: boolean;
}) {
  const price = item.prices.converted?.floor_price;

  const isPrimary = useMemo(() => {
    return item.metadata.tags?.includes('#primary');
  }, [item]);

  return (
    <Surface padding={8} style={{ width: '100%', position: 'relative' }}>
      {isPrimary ? (
        <div
          style={{
            position: 'absolute',
            color: 'var(--always-white)',
            backgroundColor: 'var(--positive-500)',
            borderRadius: 10,
            height: 20,
            width: 20,
            padding: 2,
            top: 0,
            left: 0,
            zIndex: 2,
            boxShadow: 'var(--elevation-100)',
          }}
        >
          <TickIcon width={16} height={16} />
        </div>
      ) : null}
      <SquareElement
        render={(style) => (
          <MediaContent
            content={item.metadata.content}
            alt={`${item.metadata.name} image`}
            errorStyle={
              CSS.supports('aspect-ratio: 1 / 1')
                ? undefined
                : { position: 'absolute', height: '100%' }
            }
            // selector for external css styling
            className="nft-content"
            style={{
              ...style,
              borderRadius: 8,
              objectFit: 'cover',
            }}
          />
        )}
      />
      <Spacer height={16} />
      <VStack gap={4} style={{ marginTop: 'auto' }}>
        {showCollection ? (
          <UIText
            kind="caption/regular"
            color="var(--neutral-500)"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.collection?.name || 'Untitled collection'}
          </UIText>
        ) : null}
        <UIText
          kind="small/accent"
          style={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {item.metadata.name || 'Untitled Asset'}
        </UIText>
        {price ? (
          <UIText kind="small/accent">
            <NeutralDecimals
              parts={formatCurrencyToParts(price, 'en', 'usd')}
            />
          </UIText>
        ) : someHavePrice ? (
          <UIText kind="small/accent">{NBSP}</UIText>
        ) : null}
      </VStack>
    </Surface>
  );
}
