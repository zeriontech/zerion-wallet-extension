import React from 'react';
import IconClose from 'jsx:src/ui/assets/close.svg';
import { Button } from '../../Button';
import { DialogButtonValue } from './DialogTitle';

export function DialogCloseButton({
  style,
  ...props
}: {
  style?: React.CSSProperties;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <form
      method="dialog"
      style={style}
      onSubmit={(event) => event.stopPropagation()}
    >
      <Button
        kind="ghost"
        value={DialogButtonValue.cancel}
        aria-label="Close"
        style={{ padding: 8 }}
        size={36}
        {...props}
      >
        <IconClose
          role="presentation"
          style={{ display: 'block', width: 20, height: 20 }}
        />
      </Button>
    </form>
  );
}
