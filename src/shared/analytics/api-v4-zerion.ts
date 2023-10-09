import type { Hooks } from 'defi-sdk';
import { registerRequestHooks } from 'src/modules/defi-sdk/defi-sdk-config';
import { rejectAfterDelay } from '../rejectAfterDelay';

const ANALYTICS_WALLET_PROVIDER_KEY = 'wallet_provider';

type MaybeAddressPayload = { address?: string; wallet_provider?: string };

export function createAddProviderHook({
  getWalletProvider,
}: {
  getWalletProvider: (address: string) => Promise<string>;
}): Hooks['willSendRequest'] {
  return async function addWalletProviderParam(request, { namespace }) {
    if (namespace !== 'address') {
      return request;
    }
    const { payload: payloadUnknown } = request;
    const payload = payloadUnknown as MaybeAddressPayload;
    const { address } = payload;
    if (!address) {
      return request;
    }
    try {
      const provider = await Promise.race([
        getWalletProvider(address),
        rejectAfterDelay(1000),
      ]);
      payload[ANALYTICS_WALLET_PROVIDER_KEY] = provider;
      return request;
    } catch (error) {
      return request;
    }
  };
}

export function initialize({
  willSendRequest,
}: Pick<Hooks, 'willSendRequest'>) {
  registerRequestHooks({ willSendRequest });
}
