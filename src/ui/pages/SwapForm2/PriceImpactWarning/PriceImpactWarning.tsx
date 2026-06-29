import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { formatPercent } from 'src/shared/units/formatPercent';
import {
  getPriceImpactPercentage,
  type PriceImpact,
} from '../../SwapForm/shared/price-impact';
import * as styles from './PriceImpactWarning.module.css';

export function PriceImpactWarning({
  priceImpact,
}: {
  priceImpact: PriceImpact | null;
}) {
  if (!priceImpact) {
    return null;
  }

  if (priceImpact.kind === 'n/a') {
    return (
      <div className={styles.pillError}>
        <VStack gap={8}>
          <UIText kind="small/accent" color="currentColor">
            Price unknown
          </UIText>
          <UIText kind="small/regular" color="currentColor">
            We can't verify the value you'll receive.
          </UIText>
        </VStack>
      </div>
    );
  }

  if (priceImpact.kind === 'loss' && priceImpact.level === 'high') {
    const percentage = getPriceImpactPercentage(priceImpact);
    if (percentage == null) {
      return null;
    }
    return (
      <div className={styles.pillNeutral}>
        <UIText kind="small/accent" color="var(--always-black)">
          High Price Impact
        </UIText>
        <UIText kind="small/accent" color="var(--negative-500)">
          {`${formatPercent(percentage, 'en')}%`}
        </UIText>
      </div>
    );
  }

  return null;
}
