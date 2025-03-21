import React from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { PriceImpact } from '../price-impact';

export function PriceImpactLine({ priceImpact }: { priceImpact: PriceImpact }) {
  const isHighPriceImpact =
    priceImpact.kind === 'loss' && priceImpact.level === 'high';

  return isHighPriceImpact ? (
    <Surface padding={12} style={{ backgroundColor: 'var(--neutral-100)' }}>
      <HStack gap={4} justifyContent="space-between">
        <UIText kind="body/accent">High Price Impact</UIText>
        <UIText kind="body/regular" color="var(--negative-500)">
          {priceImpact.percentage}
        </UIText>
      </HStack>
    </Surface>
  ) : null;
}
