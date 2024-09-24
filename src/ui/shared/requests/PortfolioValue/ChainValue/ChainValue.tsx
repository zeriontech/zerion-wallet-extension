import type React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';

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
  const value =
    chain === NetworkSelectValue.All
      ? chainDistribution?.totalValue
      : chainDistribution?.positionsChainsDistribution[chain.toString()];

  return formatCurrencyValue(
    value || 0,
    'en',
    currency
  ) as React.ReactNode as JSX.Element;
}
