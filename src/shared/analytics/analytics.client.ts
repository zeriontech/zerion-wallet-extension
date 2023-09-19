import { walletPort } from 'src/ui/shared/channels';
import { getUserId } from 'src/background/account/account-helpers.client';
import { emitter } from 'src/ui/shared/events';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { HandshakeFailed } from '../errors/errors';
import { rejectAfterDelay } from '../rejectAfterDelay';
import type { BaseParams } from './analytics';
import { createParams, sendToMetabase } from './analytics';
import { initialize as addWalletProviderToApiRequests } from './api-v4-zerion';

async function createClientParams<T extends BaseParams>(data: T) {
  const finalData = Object.assign({}, data);
  try {
    const tabOrigin = await getActiveTabOrigin();
    if (tabOrigin?.tabOrigin) {
      Object.assign(finalData, { dapp_domain: tabOrigin.tabOrigin });
    }
  } catch {
    // Ok, this means that we can't add dapp_domain to analytics object
  }
  try {
    const address = await Promise.race([
      walletPort
        .request('uiGetCurrentWallet')
        .then((wallet) => wallet?.address),
      rejectAfterDelay(1000),
    ]);
    if (address) {
      Object.assign(finalData, { wallet_address: address });
    }
  } catch {
    // Ok, this means that we can't add wallet_address to analytics object
  }
  return createParams(finalData);
}

function trackAppEvents() {
  emitter.on('signingError', async (signatureType, message) => {
    const userId = await getUserId();
    const params = await createClientParams({
      request_name: 'client_error',
      type: signatureType,
      message,
      user_id: userId,
    });
    sendToMetabase('client_error', params);
  });

  emitter.on('error', async (error) => {
    const userId = await getUserId();
    if (error instanceof HandshakeFailed) {
      const params = await createClientParams({
        request_name: 'client_error',
        type: 'global error',
        message: 'background script not responding',
        user_id: userId,
      });
      sendToMetabase('client_error', params);
    }
  });

  emitter.on('networksSearchResponse', async (query, resultsCount) => {
    const userId = await getUserId();
    const params = await createClientParams({
      request_name: 'network_search',
      query,
      number_of_results: resultsCount,
      user_id: userId,
    });
    sendToMetabase('network_search', params);
  });

  emitter.on('errorScreenView', async (data) => {
    const userId = await getUserId();
    const params = await createClientParams({
      request_name: 'client_error',
      type: 'global error',
      message: data.message,
      user_id: userId,
      screen_name: data.location,
    });
    sendToMetabase('client_error', params);
  });

  emitter.on('loaderScreenView', async (data) => {
    const userId = await getUserId();
    const params = await createClientParams({
      request_name: 'client_error',
      type: 'global error',
      message: `long loader view for ${data.duration}ms`,
      user_id: userId,
      screen_name: data.location,
    });
    sendToMetabase('client_error', params);
  });
}

export function initializeClientAnalytics() {
  addWalletProviderToApiRequests();
  return trackAppEvents();
}
