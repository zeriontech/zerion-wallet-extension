import type { Quote2 } from 'src/shared/types/Quote';
import { createHeaders } from 'src/modules/zerion-api/shared';
import { ZERION_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';
import { EventSourceStore } from './useEventSource';
import type { QuoteStream, RequoteDeps } from './requoteIntent';
import { QUOTES_EVENT_CODE_TO_MESSAGE } from './swapQuotesRequest';

/** Default `openStream` for requoteIntent: one v3 SSE stream, outside React */
export const openQuoteStream: RequoteDeps['openStream'] = (
  path,
  handlers
): QuoteStream => {
  const [pathname, search] = path.split('?');
  const url = createUrl({
    base: ZERION_API_URL,
    pathname,
    searchParams: new URLSearchParams(search),
  }).toString();
  const store = new EventSourceStore<Quote2[]>(url, {
    headers: createHeaders({}),
    eventCodeToMessage: QUOTES_EVENT_CODE_TO_MESSAGE,
  });
  let lastValue: Quote2[] | null = null;
  const unsub = store.on('change', (state) => {
    if (state.error) {
      handlers.onError(state.error);
      return;
    }
    if (state.value && state.value !== lastValue) {
      lastValue = state.value;
      handlers.onUpdate(state.value);
    }
    if (state.done) {
      handlers.onEnd();
    }
  });
  return {
    close: () => {
      unsub();
      store.close();
    },
  };
};
