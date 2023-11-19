import React from 'react';
import ReverseIcon from 'jsx:src/ui/assets/reverse.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from '../styles.module.css';

export const ReverseButton = ({ onClick }: { onClick: () => void }) => (
  <UnstyledButton
    type="button"
    className={styles.reverseButton}
    onClick={onClick}
  >
    <ReverseIcon style={{ color: 'var(--neutral-500)' }} />
  </UnstyledButton>
);

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
