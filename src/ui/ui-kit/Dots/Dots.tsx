import React from 'react';
import cn from 'classnames';
import styles from './styles.module.css';

export function AnimatedDots() {
  return (
    <div className={cn(styles.dots)}>
      <div>.</div>
      <div>.</div>
      <div>.</div>
    </div>
  );
}
