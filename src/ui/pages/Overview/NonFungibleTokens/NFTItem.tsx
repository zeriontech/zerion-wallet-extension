import React, { useMemo } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import type { AddressNFT } from 'src/ui/shared/requests/addressNfts/types';
import { NBSP } from 'src/ui/shared/typography';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import TickIcon from 'jsx:src/ui/assets/check.svg';
import * as s from './styles.module.css';

export function NFTItem({
  item,
  showCollection = false,
  someHavePrice = false,
}: {
  item: AddressNFT;
  showCollection?: boolean;
  someHavePrice?: boolean;
}) {
  const isPrimary = useMemo(() => {
    return item.metadata.tags?.includes('#primary');
  }, [item]);

  const price = item.prices.converted?.total_floor_price;
  const { networks } = useNetworks();

  const network = networks?.getNetworkByName(createChain(item.chain));

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <SquareElement
        style={{ position: 'relative' }}
        className={s.mediaWrapper}
        render={(style) => (
          <>
            <MediaContent
              forcePreview={true}
              content={item.metadata.content}
              alt={`${item.metadata.name} image`}
              errorStyle={
                CSS.supports('aspect-ratio: 1 / 1')
                  ? undefined
                  : { position: 'absolute', height: '100%' }
              }
              style={{
                ...style,
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
            {network ? (
              <div
                style={{
                  borderRadius: 5,
                  overflow: 'hidden',
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  border: '1px solid var(--white)',
                }}
              >
                <NetworkIcon
                  chainId={network.external_id}
                  size={12}
                  name={network.name}
                  src={network.icon_url}
                />
              </div>
            ) : null}
          </>
        )}
      />
      <Spacer height={16} />
      <VStack gap={4} style={{ marginTop: 'auto' }}>
        {showCollection ? (
          <UIText
            kind="small/accent"
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
          kind="body/accent"
          style={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {item.metadata.name || 'Untitled Asset'}
        </UIText>
        {price ? (
          <UIText kind="body/accent">
            <NeutralDecimals
              parts={formatCurrencyToParts(price, 'en', 'usd')}
            />
          </UIText>
        ) : someHavePrice ? (
          <UIText kind="body/accent">{NBSP}</UIText>
        ) : null}
      </VStack>
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
            boxShadow: 'var(--elevation-100)',
          }}
        >
          <TickIcon width={16} height={16} />
        </div>
      ) : null}
    </div>
  );
}
