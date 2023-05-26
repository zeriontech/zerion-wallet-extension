import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import IconClose from 'jsx:src/ui/assets/close.svg';

export enum DialogButtonValue {
  cancel = 'cancel',
}

export function DialogTitle({
  title,
  alignTitle = 'center',
  closeKind = 'text',
}: {
  title: React.ReactNode;
  alignTitle?: 'start' | 'center';
  closeKind?: 'text' | 'icon';
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns:
          alignTitle === 'center' ? '1fr 4fr 1fr' : 'max-content 1fr',
      }}
    >
      <div
        style={{
          gridColumnStart: alignTitle === 'center' ? 2 : 1,
          placeSelf: 'center',
        }}
      >
        {title}
      </div>
      <form method="dialog" style={{ placeSelf: 'end' }}>
        <Button
          kind="ghost"
          value={DialogButtonValue.cancel}
          aria-label="Close"
          style={
            closeKind === 'text'
              ? { color: 'var(--primary)', fontWeight: 400 }
              : { padding: 4, position: 'absolute', top: -8, right: -8 }
          }
          size={32}
        >
          {closeKind === 'text' ? (
            'Close'
          ) : (
            <IconClose
              role="presentation"
              style={{ display: 'block', marginInline: 'auto' }}
            />
          )}
        </Button>
      </form>
    </div>
  );
}
