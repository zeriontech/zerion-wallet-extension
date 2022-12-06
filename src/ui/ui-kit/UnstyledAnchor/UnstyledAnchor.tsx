import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export function UnstyledAnchor({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx(className, s.anchor)} {...props} />;
}
