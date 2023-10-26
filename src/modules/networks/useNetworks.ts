import { useStore } from '@store-unit/react';
import { useEffect } from 'react';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { networksStore } from './networks-store.client';

export function useNetworks() {
  const showErrorBoundary = useErrorBoundary();
  useEffect(() => {
    networksStore.load().catch((error) => {
      showErrorBoundary(error);
    });
  }, [showErrorBoundary]);
  const value = useStore(networksStore);
  return { networks: value.networks };
}
