import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export function TextAnchor({
  className,
  style,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cx(s.anchor, className)}
      style={{
        color: 'inherit',
        fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    />
  );
}
