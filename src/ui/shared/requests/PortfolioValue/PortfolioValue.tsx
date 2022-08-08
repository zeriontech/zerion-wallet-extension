import { useAddressPortfolio } from 'defi-sdk';
import { useMemo } from 'react';

export function PortfolioValue({
  address: addressStr,
  render,
}: {
  address: string;
  render: (value: ReturnType<typeof useAddressPortfolio>) => JSX.Element;
}) {
  const address = useMemo(() => addressStr.toLowerCase(), [addressStr]);
  const query = useAddressPortfolio({
    address,
    currency: 'usd',
    portfolio_fields: 'all',
    use_portfolio_service: true,
  });
  return render(query);
}
