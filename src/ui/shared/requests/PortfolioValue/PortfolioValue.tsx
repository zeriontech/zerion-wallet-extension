import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useMemo } from 'react';

export function PortfolioValue({
  address: addressStr,
  render,
}: {
  address: string;
  render: (
    value: ReturnType<typeof useAddressPortfolioDecomposition>
  ) => JSX.Element;
}) {
  const address = useMemo(() => addressStr.toLowerCase(), [addressStr]);
  const query = useAddressPortfolioDecomposition({
    address,
    currency: 'usd',
  });
  return render(query);
}
