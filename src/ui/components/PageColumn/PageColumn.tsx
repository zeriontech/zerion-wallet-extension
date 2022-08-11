import React from 'react';
import cx from 'classnames';
import * as styles from './styles.module.css';

export function PageColumn({
  style,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(className, styles.column)}
      style={{
        paddingLeft: 16,
        paddingRight: 16,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        // overflowY: 'auto',
        ...style,
      }}
      {...props}
    />
  );
}
