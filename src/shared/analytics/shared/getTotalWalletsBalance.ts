import type { Portfolio } from 'defi-sdk';
import { client } from 'defi-sdk';

export async function getAddressesPortfolio(addresses: string[]) {
  return new Promise<Portfolio>((resolve, reject) => {
    const rejectTimerId = setTimeout(
      () => reject(new Error(`Request timed out: getAddressesPortfolio`)),
      10000
    );
    const { unsubscribe } = client.addressPortfolio(
      {
        addresses,
        currency: 'usd', // keep currency const for analytics purpose
        portfolio_fields: 'all',
        use_portfolio_service: true,
        nft_price_type: 'not_included',
      },
      {
        method: 'get',
        cachePolicy: 'cache-first',
        onData: (value) => {
          resolve(value.portfolio);
          clearTimeout(rejectTimerId);
          unsubscribe();
        },
      }
    );
  });
}
