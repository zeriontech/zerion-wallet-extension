import React from 'react';
import cx from 'classnames';
import * as styles from './styles.module.css';

export const PAGE_PADDING_HORIZONTAL = 16;

export function PageColumn({
  style,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(className, styles.column)}
      style={{
        paddingLeft: PAGE_PADDING_HORIZONTAL,
        paddingRight: PAGE_PADDING_HORIZONTAL,
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
