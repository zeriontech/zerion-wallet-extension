import React from 'react';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from './styles.module.css';

export function ReverseButton({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton
      type="button"
      className={styles.reverseButton}
      onClick={onClick}
    >
      <ArrowRightIcon className={styles.spinArrow} />
    </UnstyledButton>
  );
}
