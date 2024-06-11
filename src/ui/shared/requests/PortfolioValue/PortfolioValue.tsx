import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';

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
  const { currency } = useCurrency();
  const query = useAddressPortfolioDecomposition({
    address,
    currency,
  });
  return render(query);
}
