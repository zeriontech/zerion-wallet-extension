import { emitter } from 'src/ui/shared/events';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { readCachedCurrentAddress } from 'src/ui/shared/user-address/useAddressParams';
import { HandshakeFailed } from '../errors/errors';
import { rejectAfterDelay } from '../rejectAfterDelay';
import { createParams, sendToMetabase } from './analytics';
import {
  createAddProviderHook,
  initialize as initializeApiV4Analytics,
} from './api-v4-zerion';
import {
  getProviderForApiV4,
  getProviderNameFromGroup,
} from './shared/getProviderNameFromGroup';

function requestWithTimeout<T>(cb: () => Promise<T>, delay = 500) {
  try {
    return Promise.race([cb(), rejectAfterDelay(delay, 'Client analytics')]);
  } catch {
    return null;
  }
}

function trackAppEvents({
  getWalletProvider,
}: {
  getWalletProvider: (address: string) => Promise<string>;
}) {
  async function createWalletProperties() {
    const address = readCachedCurrentAddress() ?? null;
    const wallet_provider = address
      ? await requestWithTimeout(() => getWalletProvider(address))
      : null;
    return { wallet_address: address, wallet_provider } as const;
  }
  emitter.on('signingError', async (signatureType, message) => {
    const params = createParams({
      request_name: 'client_error',
      type: signatureType,
      message,
      ...(await createWalletProperties()),
    });
    sendToMetabase('client_error', params);
  });

  emitter.on('error', async (error) => {
    if (error instanceof HandshakeFailed) {
      const params = createParams({
        request_name: 'client_error',
        type: 'global error',
        message: 'background script not responding',
        ...(await createWalletProperties()),
      });
      sendToMetabase('client_error', params);
    }
  });

  emitter.on('networksSearchResponse', async (query, resultsCount) => {
    const params = createParams({
      request_name: 'network_search',
      query,
      number_of_results: resultsCount,
      ...(await createWalletProperties()),
    });
    sendToMetabase('network_search', params);
  });

  emitter.on('errorScreenView', async (data) => {
    const params = createParams({
      request_name: 'client_error',
      type: 'global error',
      message: data.message,
      screen_name: data.location,
      ...(await createWalletProperties()),
    });
    sendToMetabase('client_error', params);
  });

  emitter.on('loaderScreenView', async (data) => {
    const params = createParams({
      request_name: 'client_error',
      type: 'global error',
      message: `long loader view for ${data.duration}ms`,
      screen_name: data.location,
      ...(await createWalletProperties()),
    });
    sendToMetabase('client_error', params);
  });
}

export function initializeClientAnalytics() {
  async function getWalletProvider(address: string) {
    const group = await getWalletGroupByAddress(address);
    return getProviderForApiV4(getProviderNameFromGroup(group));
  }
  initializeApiV4Analytics({
    willSendRequest: createAddProviderHook({ getWalletProvider }),
  });
  return trackAppEvents({ getWalletProvider });
}
