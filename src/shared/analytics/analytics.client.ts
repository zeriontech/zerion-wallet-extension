import { getUserId } from 'src/background/account/account-helpers.client';
import { emitter } from 'src/ui/shared/events';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { HandshakeFailed } from '../errors/errors';
import { createParams, sendToMetabase } from './analytics';
import {
  createAddProviderHook,
  initialize as initializeApiV4Analytics,
} from './api-v4-zerion';
import {
  getProviderForApiV4,
  getProviderNameFromGroup,
} from './getProviderNameFromGroup';

function trackAppEvents() {
  emitter.on('signingError', async (signatureType, message) => {
    const userId = await getUserId();
    const params = createParams({
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
      const params = createParams({
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
    const params = createParams({
      request_name: 'network_search',
      query,
      number_of_results: resultsCount,
      user_id: userId,
    });
    sendToMetabase('network_search', params);
  });

  emitter.on('errorScreenView', async (data) => {
    const userId = await getUserId();
    const params = createParams({
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
    const params = createParams({
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
  async function getWalletProvider(address: string) {
    const group = await getWalletGroupByAddress(address);
    return getProviderForApiV4(getProviderNameFromGroup(group));
  }
  initializeApiV4Analytics({
    willSendRequest: createAddProviderHook({ getWalletProvider }),
  });
  return trackAppEvents();
}
