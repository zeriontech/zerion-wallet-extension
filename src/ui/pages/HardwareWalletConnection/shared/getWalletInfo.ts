import { lookupAddressName } from 'src/modules/name-service';
import { getHttpClientSource } from 'src/modules/zerion-api/getHttpClientSource';
import { queryWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';

export interface WalletInfo {
  portfolio: number;
  name: null | string;
}

export async function getWalletInfo(
  address: string,
  currency: string
): Promise<WalletInfo> {
  const [name, portfolioData] = await Promise.all([
    lookupAddressName(address),
    queryWalletPortfolio(
      { addresses: [address], currency },
      { source: await getHttpClientSource() }
    ),
  ]);
  return { portfolio: portfolioData.data.totalValue, name };
}
