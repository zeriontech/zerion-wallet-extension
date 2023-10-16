import { addressPortfolio, client, type Portfolio } from 'defi-sdk';

export function getAddressPortfolio({ address }: { address: string }) {
  return new Promise<Portfolio>((resolve) => {
    return addressPortfolio(
      {
        address,
        currency: 'usd',
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
