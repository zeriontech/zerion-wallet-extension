import React, { useMemo } from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatPercent } from 'src/shared/units/formatPercent';
import { getPriceImpactPercentage, type PriceImpact } from '../price-impact';

export function PriceImpactLine({ priceImpact }: { priceImpact: PriceImpact }) {
  const isHighValueLoss =
    priceImpact.kind === 'loss' && priceImpact.level === 'high';

  const priceImpactPercentage = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  const percentageChange = useMemo(
    () =>
      priceImpactPercentage
        ? `${formatPercent(priceImpactPercentage, 'en')}%`
        : null,
    [priceImpactPercentage]
  );

  return isHighValueLoss ? (
    <Surface padding={12} style={{ backgroundColor: 'var(--neutral-100)' }}>
      <HStack gap={4} justifyContent="space-between">
        <UIText kind="body/accent">High Price Impact</UIText>
        {percentageChange ? (
          <UIText kind="body/regular" color="var(--negative-500)">
            {percentageChange}
          </UIText>
        ) : null}
      </HStack>
    </Surface>
  ) : null;
}
