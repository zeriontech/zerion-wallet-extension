import { useAddressPortfolio } from 'defi-sdk';
import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';

export function PortfolioValue({
  address: addressStr,
  render,
}: {
  address: string;
  render: (value: ReturnType<typeof useAddressPortfolio>) => JSX.Element;
}) {
  const address = useMemo(() => addressStr.toLowerCase(), [addressStr]);
  const { currency, ready } = useCurrency();
  const query = useAddressPortfolio(
    {
      address,
      currency: currency || '',
      portfolio_fields: 'all',
      use_portfolio_service: true,
    },
    { enabled: ready }
  );
  return render(query);
}
