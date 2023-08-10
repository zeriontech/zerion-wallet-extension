import React from 'react';
import cx from 'classnames';
import * as styles from './styles.module.css';

export const PAGE_PADDING_INLINE = 16;

export function PageColumn({
  style,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(className, styles.column)}
      style={{
        ['--column-padding-inline' as string]: `${PAGE_PADDING_INLINE}px`,
        paddingInline: 'var(--column-padding-inline)',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    />
  );
}
