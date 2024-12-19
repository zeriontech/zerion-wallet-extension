import { addressPortfolioDecomposition, client } from 'defi-sdk';
import { type PortfolioDecomposition } from 'defi-sdk';

export function getAddressPortfolio({
  address,
  currency,
}: {
  address: string;
  currency: string;
}) {
  return new Promise<PortfolioDecomposition>((resolve) => {
    return addressPortfolioDecomposition(
      {
        address,
        currency,
      },
      {
        client,
        method: 'get',
        onData(data) {
          resolve(data['portfolio-decomposition']);
        },
      }
    );
  });
}
