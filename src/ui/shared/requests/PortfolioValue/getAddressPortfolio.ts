import { addressPortfolio, client, type Portfolio } from 'defi-sdk';

export function getAddressPortfolio({
  address,
  currency,
}: {
  address: string;
  currency: string;
}) {
  return new Promise<Portfolio>((resolve) => {
    return addressPortfolio(
      {
        address,
        currency,
        portfolio_fields: 'all',
        use_portfolio_service: true,
      },
      {
        client,
        method: 'get',
        onData(data) {
          resolve(data.portfolio);
        },
      }
    );
  });
}
