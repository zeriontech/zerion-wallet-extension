import { getUserId } from 'src/background/account/account-helpers.client';
import { emitter } from 'src/ui/shared/events';
import { HandshakeFailed } from '../errors/errors';
import { createParams, sendToMetabase } from './analytics';

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
}

export function initializeClientAnalytics() {
  return trackAppEvents();
}
