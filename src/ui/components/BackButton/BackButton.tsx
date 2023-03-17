import React from 'react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';

export function BackButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <UnstyledButton aria-label="Go back" {...props}>
      <IconLeft role="presentation" style={{ display: 'block' }} />
    </UnstyledButton>
  );
}
