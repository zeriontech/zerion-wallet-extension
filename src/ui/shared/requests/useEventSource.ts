import { useStore } from '@store-unit/react';
import { useEffect, useRef } from 'react';
import { Store } from 'store-unit';
import { EventSource, type ErrorEvent } from 'eventsource'; // supports passing custom headers
import { getError } from 'get-error';

interface EventSourceState<T> {
  value: null | T;
  nextValue: null | T;
  done: boolean;
  error: null | Error;
  isLoading: boolean;
}

interface Options<T> {
  enabled?: boolean;
  mapResponse?: (response: unknown) => T;
  mergeResponse?(currentValue: T | null, nextValue: T | null): T | null;
  headers?: HeadersInit;
}

function createEventSource(url: string | URL, headers?: HeadersInit) {
  return new EventSource(
    url,
    headers
      ? {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              headers: { ...init.headers, ...headers },
            }),
        }
      : undefined
  );
}

function eventToMessage(event: ErrorEvent) {
  return event.code === 500
    ? 'Internal Server Error'
    : event.code === 503
    ? 'Service Unavailable'
    : event.code === 404
    ? 'Request Error' // temporary message while backend responds 404 for invalid params
    : event.message || 'Server Error';
}

export class EventSourceStore<T> extends Store<EventSourceState<T>> {
  source: EventSource | null;
  url: string | null;
  options: Options<T>;

  subscribe(source: EventSource | null) {
    this.source = source;
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
    this.setState((state) => ({
      ...state,
      error: new Error(eventToMessage(event)),
      isLoading: false,
      isError: true,
    }));
    this.unlistenAndClose();
  };

  handleException = (event: ErrorEvent | MessageEvent) => {
    this.setState((state) => ({
      ...state,
      error: new Error(
        'data' in event && event.data ? event.data : eventToMessage(event)
      ),
      isLoading: false,
      isError: true,
    }));
    this.unlistenAndClose();
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
    store.current.updateEventSource(enabled ? url : null, optionsRef.current);
  }, [key, url, enabled]);

  return useStore(store.current);
}
