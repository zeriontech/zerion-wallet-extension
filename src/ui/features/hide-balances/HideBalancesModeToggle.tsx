import React from 'react';
import { useStore } from '@store-unit/react';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { hideBalancesStore } from './store';

export function HideBalancesModeToggle() {
  const { mode } = useStore(hideBalancesStore);
  if (mode === hideBalancesStore.MODE.default) {
    return null;
  }
  return (
    <Button
      kind="text-primary"
      size={36}
      title="Toggle Balances: Shift+H"
      onClick={() => {
        hideBalancesStore.nextMode();
      }}
      style={{
        ['--button-text-hover' as string]: 'var(--neutral-800)',
        padding: 4,
      }}
    >
      <EyeIcon
        style={{
          display: 'block',
          color:
            mode === hideBalancesStore.MODE.blurred
              ? 'var(--neutral-800)'
              : 'var(--primary)',
        }}
      />
    </Button>
  );
}
