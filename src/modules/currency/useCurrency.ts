import { useStore } from 'src/shared/store/useStore';
import { preferenceStore } from 'src/ui/features/appearance';

export function useCurrency() {
  return useStore(preferenceStore) as { currency: string };
}
