import React from 'react';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';
import { Button } from 'src/ui/ui-kit/Button';

export function BackButton({
  style,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      kind="ghost"
      aria-label="Go back"
      size={36}
      style={{ padding: 8, ...style }}
      {...props}
    >
      <IconLeft
        role="presentation"
        style={{ display: 'block', width: 20, height: 20 }}
      />
    </Button>
  );
}
