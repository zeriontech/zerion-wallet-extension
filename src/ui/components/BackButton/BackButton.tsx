import React from 'react';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';
import { Button } from 'src/ui/ui-kit/Button';

export function BackButton({
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      kind="ghost"
      aria-label="Go back"
      size={40}
      style={{ padding: 8, ...style }}
      {...props}
    >
      <IconLeft role="presentation" style={{ display: 'block' }} />
    </Button>
  );
}
