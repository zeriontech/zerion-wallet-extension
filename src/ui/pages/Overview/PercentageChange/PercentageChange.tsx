import React from 'react';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { NBSP } from 'src/ui/shared/typography';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';

interface Props {
  walletPortfolio: WalletPortfolio | undefined;
  currency: string;
}

export function PercentageChange({ walletPortfolio, currency }: Props) {
  const relativeValue = walletPortfolio?.change24h.relative ?? null;
  const absoluteValue = walletPortfolio?.change24h.absolute ?? null;
  const isNonNegative = relativeValue == null || relativeValue >= 0;
  const isPositive = relativeValue != null && relativeValue > 0;
  const color = isNonNegative ? 'var(--positive-500)' : 'var(--negative-500)';

  return (
    <VStack gap={0}>
      <BlurrableBalance kind="headline/h1" color="var(--black)">
        <UIText kind="headline/h1">
          {walletPortfolio?.totalValue != null ? (
            <NeutralDecimals
              parts={formatCurrencyToParts(
                walletPortfolio.totalValue,
                'en',
                currency
              )}
            />
          ) : (
            NBSP
          )}
        </UIText>
      </BlurrableBalance>
      {relativeValue != null ? (
        <UIText
          kind="small/regular"
          color={color}
          style={{ display: 'flex', gap: 4 }}
        >
          <span>{`${isPositive ? '+' : ''}${formatPercent(
            relativeValue,
            'en'
          )}%`}</span>
          {absoluteValue != null ? (
            <BlurrableBalance kind="small/regular" color={color}>
              {`(${formatCurrencyValue(
                Math.abs(absoluteValue),
                'en',
                currency
              )})`}
            </BlurrableBalance>
          ) : null}
          <span>Today</span>
        </UIText>
      ) : (
        <UIText kind="small/regular">{NBSP}</UIText>
      )}
    </VStack>
  );
}
