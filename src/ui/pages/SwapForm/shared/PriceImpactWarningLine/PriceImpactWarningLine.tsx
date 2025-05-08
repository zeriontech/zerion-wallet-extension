import React, { useMemo } from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatPercent } from 'src/shared/units/formatPercent';
import { getPriceImpactPercentage, type PriceImpact } from '../price-impact';

export function PriceImpactWarningLine({
  priceImpact,
}: {
  priceImpact: PriceImpact;
}) {
  const priceImpactPercentage = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  const priceImpactText = useMemo(
    () =>
      priceImpactPercentage
        ? `${formatPercent(priceImpactPercentage, 'en')}%`
        : null,
    [priceImpactPercentage]
  );

  return (
    <Surface padding={12} style={{ backgroundColor: 'var(--neutral-100)' }}>
      <HStack gap={4} justifyContent="space-between">
        <UIText kind="body/accent">High Price Impact</UIText>
        {priceImpactText ? (
          <UIText kind="body/regular" color="var(--negative-500)">
            {priceImpactText}
          </UIText>
        ) : null}
      </HStack>
    </Surface>
  );
}
