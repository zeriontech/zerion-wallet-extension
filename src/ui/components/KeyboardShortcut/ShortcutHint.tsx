import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isMacOS } from 'src/ui/shared/isMacos';

export function ShortcutHint() {
  return (
    <UIText
      kind="caption/accent"
      style={{
        padding: '1px 3px',
        borderRadius: 6,
        color: 'var(--neutral-500)',
        backgroundColor: 'var(--neutral-800)',
      }}
    >
      {isMacOS() ? '⌘↵' : 'Ctrl+↵'}
    </UIText>
  );
}
