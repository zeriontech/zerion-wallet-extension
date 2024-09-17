import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';

export function PortfolioValue({
  address: addressStr,
  render,
}: {
  address: string;
  render: (value: ReturnType<typeof useWalletPortfolio>) => JSX.Element;
}) {
  const address = useMemo(() => addressStr.toLowerCase(), [addressStr]);
  const { currency } = useCurrency();
  const query = useWalletPortfolio(
    { addresses: [address], currency },
    { source: useHttpClientSource() }
  );
  return render(query);
}
