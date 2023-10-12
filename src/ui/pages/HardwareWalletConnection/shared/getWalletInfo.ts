import { lookupAddressName } from 'src/modules/name-service';
import { getAddressPortfolio } from 'src/ui/shared/requests/PortfolioValue/getAddressPortfolio';

export interface WalletInfo {
  portfolio: number;
  name: null | string;
}

export async function getWalletInfo(address: string): Promise<WalletInfo> {
  const name = await lookupAddressName(address);
  const portfolio = await getAddressPortfolio({ address });
  return { portfolio: portfolio.total_value, name };
}
