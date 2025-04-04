import { ServiceLocator } from 'src/background/initialize';
import { invariant } from 'src/shared/invariant';
import { getAddressProviderHeader } from './requests/shared.background';
import type { ZerionApiContext } from './zerion-api-bare';
import { ZerionApiBare } from './zerion-api-bare';

const context: ZerionApiContext = {
  getAddressProviderHeader: (address: string) => {
    const wallet = ServiceLocator.account?.getCurrentWallet();
    invariant(wallet, 'Wallet instance is not available at this point');
    return getAddressProviderHeader(wallet, address);
  },
  getKyOptions: () => ({}),
};

export const ZerionAPI = Object.assign(context, ZerionApiBare);
export type ZerionApiBackground = typeof ZerionAPI;
