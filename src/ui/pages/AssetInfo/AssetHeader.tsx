import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { emitter } from 'src/ui/shared/events';
import { emDash } from 'src/ui/shared/typography';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import * as styles from './styles.module.css';

export function AssetHeader({ asset }: { asset: Asset }) {
  const { currency } = useCurrency();
  const { innerWidth } = useWindowSizeStore();
  const isUntrackedAsset = asset.meta.price == null;
  const priceElementRef = useRef<HTMLDivElement>(null);
  const symbolPlaceholderElementRef = useRef<HTMLDivElement>(null);
  const dashPlaceholderElementRef = useRef<HTMLDivElement>(null);
  const pricePlaceholderElementRef = useRef<HTMLDivElement>(null);

  const [iconOffset, setIconOffset] = useState(0);
  const [symbolOffset, setSymbolOffset] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const [priceOffset, setPriceOffset] = useState(0);

  useEffect(() => {
    return emitter.on('assetPriceSelected', (formattedPrice) => {
      if (priceElementRef.current) {
        priceElementRef.current.innerText = formattedPrice;
      }
    });
  }, []);

  useEffect(() => {
    if (
      symbolPlaceholderElementRef.current &&
      pricePlaceholderElementRef.current &&
      dashPlaceholderElementRef.current
    ) {
      const iconWidth = 20;
      const gapWidth = 4;
      const panelWidth = innerWidth - 92;
      const symbolWidth = symbolPlaceholderElementRef.current.offsetWidth;
      const dashWidth = dashPlaceholderElementRef.current.offsetWidth;
      const priceWidth = pricePlaceholderElementRef.current.offsetWidth;
      const contentWidth =
        iconWidth + symbolWidth + dashWidth + priceWidth + 4 * gapWidth;

      const startOffset = (panelWidth - contentWidth) / 2;
      setIconOffset((startOffset - iconWidth) * 2);
      setSymbolOffset(startOffset + iconWidth + 2 * gapWidth - 56);
      setDashOffset(
        startOffset + iconWidth + 2 * gapWidth + symbolWidth + gapWidth
      );
      setPriceOffset(
        startOffset +
          iconWidth +
          2 * gapWidth +
          symbolWidth +
          gapWidth +
          dashWidth +
          gapWidth
      );
    }
  }, [innerWidth]);

  return (
    <HStack
      gap={8}
      alignItems="center"
      style={{
        paddingLeft: 8,
        position: 'relative',
        ['--asset-header-icon-offset' as string]: `${iconOffset}px`,
        ['--asset-header-symbol-offset' as string]: `${symbolOffset}px`,
        ['--asset-header-dash-offset' as string]: `${dashOffset}px`,
        ['--asset-header-price-offset' as string]: `${priceOffset}px`,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div className={cn(styles.headerItem, styles.headerIcon)}>
          <TokenIcon
            src={asset.iconUrl}
            symbol={asset.symbol}
            size={40}
            title={asset.name}
          />
        </div>
        {asset.new ? (
          <UIText
            kind="caption/accent"
            className={cn(styles.headerItem, styles.dissapearItem)}
            color="var(--white)"
            style={{
              position: 'absolute',
              top: 32,
              left: 4,
              background: 'var(--black)',
              borderRadius: 6,
              padding: '2px 4px',
            }}
          >
            new
          </UIText>
        ) : null}
      </div>
      <VStack gap={0} style={{ justifyItems: 'start', height: 40 }}>
        <div className={cn(styles.headerItem, styles.symbolItem)}>
          {asset.symbol}
        </div>
        <HStack
          gap={4}
          alignItems="center"
          className={cn(styles.headerItem, styles.dissapearItem)}
          style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
        >
          <UIText
            kind="headline/h3"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {asset.name}
          </UIText>
          {asset.verified ? <VerifiedIcon /> : null}
        </HStack>
      </VStack>
      {isUntrackedAsset ? null : (
        <>
          <UIText
            kind="body/accent"
            className={cn(styles.headerItem, styles.dashItem)}
          >
            {emDash}
          </UIText>
          <div
            ref={priceElementRef}
            className={cn(styles.headerItem, styles.priceItem)}
          >
            {formatPriceValue(asset.meta.price || 0, 'en', currency)}
          </div>
        </>
      )}

      {/* items for distance measure */}
      <UIText
        kind="body/accent"
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          pointerEvents: 'none',
          color: 'transparent',
        }}
        ref={symbolPlaceholderElementRef}
      >
        {asset.symbol}
      </UIText>
      <UIText
        kind="body/accent"
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          pointerEvents: 'none',
          color: 'transparent',
        }}
        ref={dashPlaceholderElementRef}
      >
        {emDash}
      </UIText>
      <UIText
        kind="body/accent"
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          pointerEvents: 'none',
          color: 'transparent',
        }}
        ref={pricePlaceholderElementRef}
      >
        {formatPriceValue(asset.meta.price || 0, 'en', currency)}
      </UIText>
    </HStack>
  );
}
