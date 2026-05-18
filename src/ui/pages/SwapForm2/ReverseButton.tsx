import React, { useRef } from 'react';
import ReverseIcon from 'jsx:src/ui/assets/reverse.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from './styles.module.css';

export function MiddleLine() {
  return (
    <div
      style={{
        height: 2,
        width: '100%',
        backgroundColor: 'var(--neutral-100)',
      }}
    />
  );
}

export const ReverseButton = ({ onClick }: { onClick: () => void }) => {
  const clickCountRef = useRef(0);
  return (
    <UnstyledButton
      type="button"
      className={styles.reverseButton}
      onClick={(event) => {
        onClick();
        const icon = event.currentTarget.querySelector('svg');
        const spin = clickCountRef.current % 2 ? '-180deg' : '180deg';
        icon?.animate(
          [
            { transform: 'rotate(0) scale(0.90)', opacity: 0.9 },
            { transform: `rotate(${spin}) scale(1)`, opacity: 1 },
          ],
          { duration: 160, easing: 'ease-in-out' }
        );
        clickCountRef.current += 1;
      }}
    >
      <ReverseIcon style={{ color: 'var(--neutral-500)' }} />
    </UnstyledButton>
  );
};
