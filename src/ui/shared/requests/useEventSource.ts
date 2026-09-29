import { useStore } from '@store-unit/react';
import { useEffect, useRef } from 'react';
import { Store } from 'store-unit';
import { EventSource, type ErrorEvent } from 'eventsource'; // supports passing custom headers
import { getError } from 'get-error';
import { invariant } from 'src/shared/invariant';
import {
  parseQuoteErrorDetailsFromText,
  type QuoteErrorDetails,
} from './quoteErrorDetails';
import { QuotesError } from './QuotesError';

interface EventSourceState<T> {
  value: null | T;
  nextValue: null | T;
  done: boolean;
  error: null | QuotesError;
  isLoading: boolean;
}

interface Options<T> {
  enabled?: boolean;
  mapResponse?: (response: unknown) => T;
  mergeResponse?(currentValue: T | null, nextValue: T | null): T | null;
  headers?: HeadersInit;
  eventCodeToMessage?: Record<number, string>;
  onError?: (params: {
    parsedError: QuotesError;
    rawEvent: ErrorEvent;
    requestUrl: URL;
  }) => void;
}

/**
 * `eventsource` reports a non-200 response as a bare `ErrorEvent` with the
 * status code only and never reads the body, so the body is read here — before
 * the library sees the response — to keep the backend's error wording.
 */
function createEventSource(url: string | URL, headers?: HeadersInit) {
  let errorDetails: QuoteErrorDetails | null = null;
  const source = new EventSource(url, {
    fetch: async (input, init) => {
      const response = await fetch(input, {
        ...init,
        headers: { ...init.headers, ...headers },
      });
      if (!response.ok) {
        errorDetails = await response
          .clone()
          .text()
          .then(parseQuoteErrorDetailsFromText, () => null);
      }
      return response;
    },
  });
  return { source, getErrorDetails: () => errorDetails };
}

const DEFAULT_EVENT_CODE_TO_MESSAGE = {
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

function eventToError(
  event: ErrorEvent,
  eventCodeToMessage: Record<number, string> = DEFAULT_EVENT_CODE_TO_MESSAGE,
  details: QuoteErrorDetails | null = null
) {
  return new QuotesError(
    (event.code != null && eventCodeToMessage[event.code]) ||
      event.message ||
      'Server Error',
    event.code || 500,
    details
  );
}

/**
 * An `exception` event carries either the ZPI `errors` JSON or plain text;
 * both are backend-authored, so plain text is kept as the detail.
 */
function exceptionDataToError(data: string) {
  const details = parseQuoteErrorDetailsFromText(data);
  if (details) {
    return new QuotesError(
      details.detail ?? details.title ?? data,
      500,
      details
    );
  }
  return new QuotesError(data, 500, {
    title: null,
    detail: data,
    dappName: null,
    dappUrl: null,
  });
}

export class EventSourceStore<T> extends Store<EventSourceState<T>> {
  source: EventSource | null;
  getErrorDetails: () => QuoteErrorDetails | null = () => null;
  url: string | null;
  options: Options<T>;

  subscribe(connection: ReturnType<typeof createEventSource> | null) {
    const source = connection?.source ?? null;
    this.source = source;
    this.getErrorDetails = connection?.getErrorDetails ?? (() => null);
    this.setState((state) => ({
      ...state,
      isLoading: Boolean(source),
      error: null,
    }));
    if (!this.source) {
      return;
    }
    this.source.addEventListener('update', this.handleUpdate);
    this.source.addEventListener('message', this.handleUpdate);
    this.source.addEventListener('error', this.handleError);
    this.source.addEventListener('exception', this.handleException);
    this.source.addEventListener('end', this.handleEnd);
  }

  constructor(url: string | null, options?: Options<T>) {
    super({
      value: null,
      nextValue: null,
      done: false,
      error: null,
      isLoading: Boolean(url),
    });
    this.source = null;
    this.url = url;
    this.options = options || {};
    this.subscribe(url ? createEventSource(url, this.options.headers) : null);
  }

  mapResponse(response: T) {
    const { mapResponse } = this.options;
    return mapResponse ? mapResponse(response) : response;
  }

  handleUpdate = (event: MessageEvent) => {
    try {
      const { mergeResponse } = this.options;

      const nextValue = this.mapResponse(JSON.parse(event.data));
      const value =
        this.getState().done && mergeResponse
          ? mergeResponse(this.getState().value, nextValue)
          : nextValue;

      this.setState((state) => ({
        ...state,
        value,
        nextValue,
        isError: false,
      }));
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.handleError({
          ...event,
          message: "Couldn't parse API response",
        });
      } else {
        this.handleError({ ...event, message: getError(error).message });
      }
    }
  };

  handleError = (event: ErrorEvent) => {
    const error = eventToError(
      event,
      this.options.eventCodeToMessage,
      this.getErrorDetails()
    );
    this.setState((state) => ({
      ...state,
      error,
      isLoading: false,
      isError: true,
    }));
    this.unlistenAndClose();
    invariant(this.url, 'URL must be set in order to call onError');
    this.options.onError?.({
      parsedError: error,
      rawEvent: event,
      requestUrl: new URL(this.url),
    });
  };

  handleException = (event: ErrorEvent | MessageEvent) => {
    const error =
      'data' in event && event.data
        ? exceptionDataToError(event.data)
        : eventToError(event, this.options.eventCodeToMessage);
    this.setState((state) => ({
      ...state,
      error,
      isLoading: false,
      isError: true,
    }));
    this.unlistenAndClose();
    invariant(this.url, 'URL must be set in order to call onError');
    this.options.onError?.({
      parsedError: error,
      rawEvent: event,
      requestUrl: new URL(this.url),
    });
  };

  handleEnd = () => {
    this.setState((state) => ({
      ...state,
      value: state.nextValue,
      nextValue: null,
      done: true,
      isLoading: false,
    }));
    this.unlistenAndClose();
  };

  unlistenAndClose() {
    this.source?.removeEventListener('update', this.handleUpdate);
    this.source?.removeEventListener('message', this.handleUpdate);
    this.source?.removeEventListener('error', this.handleError);
    this.source?.removeEventListener('exception', this.handleException);
    this.source?.removeEventListener('end', this.handleEnd);
    this.source?.close();
  }

  updateEventSource(url: string | null, options?: Options<T>) {
    this.url = url;
    this.unlistenAndClose();
    this.options = options || {};
    this.subscribe(
      this.url ? createEventSource(this.url, this.options.headers) : null
    );
  }

  clear() {
    this.setState((state) => ({ ...state, value: null, done: false }));
  }

  close = () => {
    this.unlistenAndClose();
  };
}

export function useEventSource<T>(
  key: string,
  url: string | null,
  options?: Options<T>
) {
  const urlRef = useRef(url);
  urlRef.current = url;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const store = useRef<EventSourceStore<T> | null>(null);
  if (!store.current) {
    store.current = new EventSourceStore<T>(null, optionsRef.current);
  }
  const { enabled = true } = options || {};

  const keyRef = useRef(key);
  if (keyRef.current !== key) {
    store.current?.clear();
    store.current?.close();
    keyRef.current = key;
  }
  // useEffect(() => {
  //   const currentStore = store.current;
  //   return () => {
  //     currentStore?.clear();
  //     currentStore?.close();
  //   };
  // }, [key]);

  useEffect(() => {
    if (!store.current) {
      return;
    }
    store.current.updateEventSource(
      enabled ? urlRef.current : null,
      optionsRef.current
    );
  }, [key, enabled]);

  return useStore(store.current);
}
