import type React from 'react';
import type { PortfolioDecomposition } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';

export type ChainDistribution = Pick<
  PortfolioDecomposition,
  'positions_chains_distribution' | 'total_value' | 'chains'
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
  const value =
    chain === NetworkSelectValue.All
      ? chainDistribution?.total_value
      : chainDistribution?.positions_chains_distribution[chain.toString()];

  return formatCurrencyValue(
    value || 0,
    'en',
    currency
  ) as React.ReactNode as JSX.Element;
}
