import React from 'react';
import * as styles from './styles.module.css';

export function TextPulse(props: React.HTMLProps<HTMLSpanElement>) {
  return <span className={styles.pulse} {...props} />;
}
