import React from 'react';
import { formatPercent } from 'src/shared/units/formatPercent';
import { TransactionWarning } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getPriceImpactPercentage, type PriceImpact } from '../price-impact';

export function PriceImpactLine({
  priceImpact,
  style,
}: {
  priceImpact: PriceImpact;
  style?: React.CSSProperties;
}) {
  const priceImpactPercentage = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  if (!priceImpactPercentage) {
    return null;
  }

  if (priceImpact?.kind === 'n/a') {
    return (
      <TransactionWarning
        title="Warning"
        message="Price is unknown for one token. Proceed with caution"
        style={style}
      />
    );
  }

  return (
    <UIText
      kind="body/accent"
      color="var(--negative-500)"
      style={{
        borderRadius: 24,
        border: '1px solid var(--negative-300)',
        background:
          'linear-gradient(94deg, var(--negative-200) 0%, var(--negative-300) 100%)',
        padding: '12px 16px',
        ...style,
      }}
    >
      This trade will result in{' '}
      {formatPercent(Math.abs(priceImpactPercentage), 'en', {
        maximumFractionDigits: 0,
      })}
      % loss
    </UIText>
  );
}
