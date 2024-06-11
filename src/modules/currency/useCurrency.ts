import { useStore } from '@store-unit/react';
import { preferenceStore } from 'src/ui/features/appearance';

export function useCurrency() {
  return useStore(preferenceStore) as { currency: string };
}
