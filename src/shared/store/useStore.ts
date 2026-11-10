import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Store } from './store';

type StorePublicInterface<T> = Omit<Store<T>, 'emitter'>;
interface DisposableStore<T> extends StorePublicInterface<T> {
  dispose: () => void;
}

function isDisposable<T>(
  store: StorePublicInterface<T> | DisposableStore<T>,
): store is DisposableStore<T> {
  return 'dispose' in store && Boolean(store.dispose);
}

/** Subscribe a component to a vendored store. */
export function useStore<State>(
  store: StorePublicInterface<State> | DisposableStore<State>,
): State {
  const state = useSyncExternalStore(
    (onStoreChange) => store.on('change', onStoreChange),
    () => store.getState(),
  );
  useEffect(() => {
    return () => {
      if (isDisposable(store)) {
        store.dispose();
      }
    };
  }, [store]);
  return state;
}

/** Subscribe to a subset of store fields, re-rendering only when they change. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSelectorStore<T extends Record<string, any>>(
  store: Store<T>,
  fields: (keyof T)[],
): T {
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const [state, setState] = useState(() => store.getState());
  const stateRef = useRef(state);
  const current = store.getState();
  if (current !== state) {
    const changed = fieldsRef.current.some((field) => current[field] !== state[field]);
    if (changed) {
      stateRef.current = current;
      setState(current);
    } else {
      stateRef.current = current;
    }
  }
  useEffect(() => {
    const unsubscribe = store.on('change', (next, prev) => {
      if (fieldsRef.current.some((field) => next[field] !== prev[field])) {
        setState(next);
      }
    });
    return () => {
      unsubscribe();
      if (isDisposable(store)) {
        store.dispose();
      }
    };
  }, [store]);
  return state;
}
