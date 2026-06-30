import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import type { DistributionItem } from 'src/ui/components/DistributionChart';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { Image2 } from 'src/ui/ui-kit/MediaFallback/MediaFallback2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';

const ICON_SIZE = 24;

/**
 * Dialog header for a distribution tile: its icon (or glyph) + label, followed
 * by the tile's total balance — mirroring the `name · value` layout of the
 * positions-group protocol heading.
 */
export function DistributionItemTitle({ item }: { item: DistributionItem }) {
  const { currency } = useCurrency();
  return (
    <HStack gap={8} alignItems="center">
      {item.iconNode ? (
        item.iconNode
      ) : (
        <Image2
          src={item.iconUrl ?? undefined}
          alt={item.label}
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 6,
            display: 'block',
            objectFit: 'cover',
          }}
          renderError={() => (
            <div
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 6,
                backgroundColor: 'var(--neutral-300)',
              }}
            />
          )}
        />
      )}
      <UIText
        kind="body/accent"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{item.label}</span>
        <span style={{ color: 'var(--neutral-500)' }}> · </span>
        <BlurrableBalance kind="body/accent" color="var(--black)">
          <NeutralDecimals
            parts={formatCurrencyToParts(item.value, 'en', currency)}
          />
        </BlurrableBalance>
      </UIText>
    </HStack>
  );
}
