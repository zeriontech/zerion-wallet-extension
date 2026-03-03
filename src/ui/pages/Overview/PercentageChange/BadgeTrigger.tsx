import React from 'react';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as styles from './BadgeTrigger.module.css';

interface Props {
  children: React.ReactNode;
  isOpen?: boolean;
}

export function BadgeTrigger({ children, isOpen }: Props) {
  return (
    <div className={styles.trigger}>
      <UIText kind="caption/accent" color="var(--neutral-600)">
        {children}
      </UIText>
      <ChevronDownIcon
        style={{
          width: 12,
          height: 12,
          color: 'var(--neutral-600)',
          transform: isOpen ? 'rotate(180deg)' : undefined,
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}
