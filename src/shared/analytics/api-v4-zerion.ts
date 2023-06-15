import type { Hooks } from 'defi-sdk';
import { registerRequestHooks } from 'src/modules/defi-sdk/defi-sdk-config';

const ANALYTICS_WALLET_PROVIDER_KEY = 'wallet_provider';

type MaybeAddressPayload = { address?: string; wallet_provider?: string };

const addWalletProviderParam: Hooks['willSendRequest'] = (
  request,
  { namespace }
) => {
  if (namespace !== 'address') {
    return request;
  }
  const { payload: payloadUnknown } = request;
  const payload = payloadUnknown as MaybeAddressPayload;
  const { address } = payload;
  if (!address) {
    return request;
  }
  // Once we support ledger OR watch addresses, we should read
  // wallet provider from WalletRecord state somehow
  payload[ANALYTICS_WALLET_PROVIDER_KEY] = 'zerion-extension';
  return request;
};

export function initialize() {
  registerRequestHooks({ willSendRequest: addWalletProviderParam });
}
