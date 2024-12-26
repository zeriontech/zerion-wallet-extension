import type { PortfolioDecomposition } from 'defi-sdk';
import { client } from 'defi-sdk';

export async function getAddressesPortfolio(addresses: string[]) {
  return new Promise<PortfolioDecomposition>((resolve, reject) => {
    const rejectTimerId = setTimeout(
      () => reject(new Error('Request timed out: getAddressesPortfolio')),
      10000
    );
    const { unsubscribe } = client.addressPortfolioDecomposition(
      {
        addresses,
        currency: 'usd', // keep currency const for analytics purpose
        nft_price_type: 'not_included',
      },
      {
        method: 'get',
        cachePolicy: 'cache-first',
        onData: (value) => {
          resolve(value['portfolio-decomposition']);
          clearTimeout(rejectTimerId);
          unsubscribe();
        },
      }
    );
  });
}
