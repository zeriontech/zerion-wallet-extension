import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function PortfolioValue({
  address,
  enabled = true,
  render,
}: {
  address: string;
  enabled?: boolean;
  render: (value: ReturnType<typeof useWalletPortfolio>) => React.ReactNode;
}) {
  const { currency } = useCurrency();
  const query = useWalletPortfolio(
    { addresses: [normalizeAddress(address)], currency },
    { source: useHttpClientSource() },
    { enabled }
  );
  return render(query);
}
