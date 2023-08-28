import { getUserId } from 'src/background/account/account-helpers.client';
import { emitter } from 'src/ui/shared/events';
import { HandshakeFailed } from '../errors/errors';
import { createParams, sendToMetabase } from './analytics';
import { initialize as addWalletProviderToApiRequests } from './api-v4-zerion';

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

  emitter.on('errorScreenView', (error) => {
    const params = createParams({
      request_name: 'error_screen_view',
      error: error.message,
    });
    sendToMetabase('error_screen_view', params);
  });

  emitter.on('loaderScreenView', (data) => {
    const params = createParams({
      request_name: 'loader_screen_view',
      sessionId: data.sessionId,
      screen_name: data.location,
      duration: data.duration,
    });
    sendToMetabase('loader_screen_view', params);
  });
}

export function initializeClientAnalytics() {
  addWalletProviderToApiRequests();
  return trackAppEvents();
}
