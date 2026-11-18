import { useEffect, useRef, useState } from 'react';
import type { Store } from './store';

type StorePublicInterface<T> = Omit<Store<T>, 'emitter'>;

interface DisposableStore<T> extends StorePublicInterface<T> {
  dispose: () => void;
}

function isDisposableStore<T>(
  store: StorePublicInterface<T> | DisposableStore<T>,
): store is DisposableStore<T> {
  return 'dispose' in store && Boolean(store.dispose);
}

export function useStore<State>(store: StorePublicInterface<State> | DisposableStore<State>) {
  const [value, setValue] = useState<StorePublicInterface<State>['state']>(() => {
    return store.getState();
  });
  const newValue = store.getState();
  if (newValue !== value) {
    setValue(newValue);
  }
  useEffect(() => {
    let didUnsubscribe = false;
    setValue(store.getState());
    const unlisten = store.on('change', (newState) => {
      if (didUnsubscribe) {
        return;
      }
      setValue(newState);
    });
    return () => {
      didUnsubscribe = true;
      unlisten();
      if (isDisposableStore(store)) {
        store.dispose();
      }
    };
  }, [store]);
  return value;
}

// oxlint-disable-next-line typescript/no-explicit-any -- matches store-unit's public generic
export function useSelectorStore<T extends Record<string, any>>(
  store: Store<T>,
  fieldsOrComparer: (keyof T)[],
) {
  const keysRef = useRef<null | Array<keyof T>>(fieldsOrComparer);
  if (keysRef.current !== fieldsOrComparer) {
    keysRef.current = fieldsOrComparer;
  }
  const [value, setValue] = useState<StorePublicInterface<T>['state']>(() => {
    return store.getState();
  });
  const lastCheckedValueRef = useRef(value);
  const newValue = store.getState();
  if (newValue !== value) {
    if (lastCheckedValueRef.current !== newValue) {
      if (keysRef.current.some((key) => newValue[key] !== value[key])) {
        setValue(newValue);
      }
    }
    lastCheckedValueRef.current = newValue;
  }
  useEffect(() => {
    let didUnsubscribe = false;
    setValue(store.getState());
    const unlisten = store.on('change', (newState, prevState) => {
      if (didUnsubscribe || !keysRef.current) {
        return;
      }
      if (keysRef.current.some((key) => newState[key] !== prevState[key])) {
        setValue(newState);
      }
    });
    return () => {
      didUnsubscribe = true;
      unlisten();
      if (isDisposableStore(store)) {
        store.dispose();
      }
    };
  }, [store]);
  return value;
}
