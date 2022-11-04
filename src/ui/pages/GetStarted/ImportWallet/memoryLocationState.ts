/**
 * This module is a precaution. Normally, we'd use location state
 * or searchParams for routes like
 * '/get-started/import/mnemonic' and '/get-started/import/private-key',
 * but storing privateKey or a mnemonic in browser history seems
 * to be unsafe. Instead, we're creating a simple in-memory store
 * which serves the same purpose as location state.
 *
 * Usage:
 * The store should be used only for `?state=memory` search params
 * This is done to avoid reading state when you navigate to a route
 * without expecting this state to be read
 */
import { useStore } from '@store-unit/react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Store } from 'store-unit';

type State = Record<string, { value: string } | undefined>;

export class MemoryLocationState extends Store<State> {
  set(key: string, value: string) {
    this.setState((state) => ({ ...state, [key]: { value } }));
  }
}

const EMPTY_VALUE = { value: undefined };

export function useMemoryLocationState(store: MemoryLocationState) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const state = useStore(store);
  if (params.get('state') === 'memory') {
    // only use this store if it's explicitly expected
    return state[pathname] || EMPTY_VALUE;
  } else {
    return EMPTY_VALUE;
  }
}
