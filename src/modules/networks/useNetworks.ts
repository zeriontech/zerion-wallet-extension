import { useStore } from '@store-unit/react';
import { useEffect } from 'react';
import { networksStore } from './networks-store.client';

export function useNetworks() {
  useEffect(() => {
    networksStore.load();
  }, []);
  const value = useStore(networksStore);
  return { networks: value.networks };
}
