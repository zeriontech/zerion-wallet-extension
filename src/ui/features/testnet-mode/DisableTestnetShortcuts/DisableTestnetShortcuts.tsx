import { useEffect, useId } from 'react';
import { testnetModeStore } from '../store';

export function DisableTestnetShortcuts() {
  const id = useId();
  useEffect(() => {
    testnetModeStore.disable(id);
    return () => {
      testnetModeStore.enable(id);
    };
  }, [id]);
  return null;
}
