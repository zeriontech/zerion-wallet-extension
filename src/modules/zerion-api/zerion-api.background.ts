import ky from 'ky';
import { ServiceLocator } from 'src/background/ServiceLocator';
import { FEATURE_BACKGROUND_CLOUDFLARE_CHALLENGE } from 'src/env/config';
import { invariant } from 'src/shared/invariant';
import { createChallengeAfterResponse } from 'src/background/cloudflare/challenge-hook';
import { getBackgroundChallengeCoordinator } from 'src/background/cloudflare/registry';
import { getAddressProviderHeader } from './requests/shared.background';
import type { ZerionApiContext } from './zerion-api-bare';
import { ZerionApiBare } from './zerion-api-bare';

const challengeAfterResponse = createChallengeAfterResponse({
  getHandler: getBackgroundChallengeCoordinator,
  retry: (request, options) => ky(request, options),
});

const context: ZerionApiContext = {
  getAddressProviderHeader: (address: string) => {
    const wallet = ServiceLocator.account?.getCurrentWallet();
    invariant(wallet, 'Wallet instance is not available at this point');
    return getAddressProviderHeader(wallet, address);
  },
  getKyOptions: () =>
    FEATURE_BACKGROUND_CLOUDFLARE_CHALLENGE === 'on'
      ? { hooks: { afterResponse: [challengeAfterResponse] } }
      : {},
};

export const ZerionAPI = Object.assign(context, ZerionApiBare);
export type ZerionApiBackground = typeof ZerionAPI;
