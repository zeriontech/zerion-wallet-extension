import React from 'react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import cn from 'classnames';
import * as styles from './styles.module.css';

export const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  { isActive: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ isActive, ...props }, ref) => {
  return (
    <UnstyledButton
      className={cn(styles.toggleButton, {
        [styles.active]: isActive,
      })}
      ref={ref}
      {...props}
    >
      {props.children}
    </UnstyledButton>
  );
});
