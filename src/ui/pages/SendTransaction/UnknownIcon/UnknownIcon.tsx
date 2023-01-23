import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';

export function UnknownIcon({ size }: { size: number }) {
  return (
    <UIText
      kind="headline/h3"
      style={{
        height: size,
        width: size,
        lineHeight: `${size}px`,
        textAlign: 'center',
        fontWeight: 'normal',
        borderRadius: 6,
        backgroundColor: 'var(--neutral-300)',
        userSelect: 'none',
        color: 'var(--neutral-500)',
      }}
    >
      ?
    </UIText>
  );
}
