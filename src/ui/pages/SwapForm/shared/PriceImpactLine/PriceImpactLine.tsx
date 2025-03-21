import React from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PercentChange } from 'src/ui/components/PercentChange';
import type { PriceImpact } from '../price-impact';

export function PriceImpactLine({ priceImpact }: { priceImpact: PriceImpact }) {
  const isHighValueLoss =
    priceImpact.kind === 'loss' && priceImpact.level === 'high';

  return isHighValueLoss ? (
    <Surface padding={12} style={{ backgroundColor: 'var(--neutral-100)' }}>
      <HStack gap={4} justifyContent="space-between">
        <UIText kind="body/accent">High Price Impact</UIText>
        <PercentChange
          value={priceImpact.ratio * 100}
          locale="en"
          render={(change) => {
            return (
              <UIText kind="body/regular" color="var(--negative-500)">
                {change.formatted}
              </UIText>
            );
          }}
        />
      </HStack>
    </Surface>
  ) : null;
}
