import React from 'react';
import IconClose from 'jsx:src/ui/assets/close.svg';
import { Button } from '../../Button';
import { DialogButtonValue } from './DialogTitle';

export function DialogCloseButton() {
  return (
    <form
      method="dialog"
      style={{
        position: 'absolute',
        insetInlineEnd: 8,
        insetBlockStart: 8,
      }}
    >
      <Button
        kind="ghost"
        value={DialogButtonValue.cancel}
        aria-label="Close"
        style={{ padding: 8 }}
        size={40}
      >
        <IconClose
          role="presentation"
          style={{ display: 'block', marginInline: 'auto' }}
        />
      </Button>
    </form>
  );
}
