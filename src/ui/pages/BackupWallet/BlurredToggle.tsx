import React, { useReducer, useRef } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';

export function BlurredToggle({ children }: React.PropsWithChildren) {
  const [hidden, toggleHidden] = useReducer((x) => !x, true);
  const ref = useRef<HTMLButtonElement | null>(null);
  return (
    <ZStack>
      <Button
        kind="ghost"
        ref={ref}
        type="button"
        aria-label="Visually reveal value"
        size={32}
        style={{
          placeSelf: 'end',
          zIndex: 1,
          marginRight: 4,
          marginBottom: 4,
        }}
        onClick={() => {
          toggleHidden();
        }}
      >
        {React.createElement(hidden ? InvisibleIcon : VisibleIcon, {
          style: {
            display: 'block',
            width: 24,
            height: 24,
            color: 'var(--primary)',
          },
        })}
      </Button>
      <div
        style={{
          filter: hidden ? 'blur(5px)' : undefined,
          transition: 'filter 250ms',
        }}
      >
        {children}
      </div>
    </ZStack>
  );
}
