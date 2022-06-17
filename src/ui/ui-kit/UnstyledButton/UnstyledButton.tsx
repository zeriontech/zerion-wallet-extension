import React from 'react';
import cx from 'classnames';
import * as s from './UnstyledButton.module.css';

export function UnstyledButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx(s.button)} {...props} />;
}
