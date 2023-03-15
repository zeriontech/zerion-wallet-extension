import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export function TextAnchor({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx(s.anchor, className)} {...props} />;
}
