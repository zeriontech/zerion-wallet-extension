import React from 'react';
import * as styles from './styles.module.css';

export function TokenListSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonLineLg} />
            <div className={styles.skeletonLineSm} />
          </div>
          <div className={styles.skeletonValues}>
            <div className={styles.skeletonValueLg} />
            <div className={styles.skeletonValueSm} />
          </div>
        </div>
      ))}
    </>
  );
}
