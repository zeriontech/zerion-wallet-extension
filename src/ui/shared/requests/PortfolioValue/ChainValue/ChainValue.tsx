import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { HideBalance } from 'src/ui/components/HideBalance';

export type ChainDistribution = Pick<
  WalletPortfolio,
  'positionsChainsDistribution' | 'totalValue' | 'chains'
>;

export function ChainValue({
  chainDistribution,
  chain,
  currency,
}: {
  chain: Chain | NetworkSelectValue.All;
  chainDistribution: ChainDistribution | null;
  currency: string;
}) {
  const maybeValue =
    chain === NetworkSelectValue.All
      ? chainDistribution?.totalValue
      : chainDistribution?.positionsChainsDistribution[chain.toString()];

  const value = maybeValue || 0;

  return (
    <HideBalance value={value} locale="en" currency={currency}>
      {formatCurrencyValue(value, 'en', currency)}
    </HideBalance>
  );
}
