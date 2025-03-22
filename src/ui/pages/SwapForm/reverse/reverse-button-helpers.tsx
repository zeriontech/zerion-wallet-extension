import React, { useRef } from 'react';
import ReverseIcon from 'jsx:src/ui/assets/reverse.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { registerPreview } from 'src/ui-lab/previews/registerPreview';
import * as styles from '../styles.module.css';

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

registerPreview({
  component: (
    <div style={{ position: 'relative' }}>
      <ReverseButton
        onClick={() => {
          // pass
        }}
      />
    </div>
  ),
});

export const BottomArc = () => (
  <div
    className={styles.bottomArc}
    style={{
      pointerEvents: 'none',
      position: 'absolute',
      left: 'calc(50% - 21px)',
      bottom: 0,
      width: 42,
      height: 19,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        boxSizing: 'content-box',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid var(--neutral-400)',
      }}
    />
  </div>
);

export const TopArc = () => (
  <div
    className={styles.topArc}
    style={{
      pointerEvents: 'none',
      position: 'absolute',
      left: 'calc(50% - 21px)',
      top: 0,
      width: 42,
      height: 19,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'end',
    }}
  >
    <div
      style={{
        boxSizing: 'content-box',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid var(--neutral-400)',
      }}
    />
  </div>
);
