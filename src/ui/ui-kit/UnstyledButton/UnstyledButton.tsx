import React from 'react';
import cx from 'classnames';
import * as s from './UnstyledButton.module.css';

export const UnstyledButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return <button className={cx(s.button, className)} {...props} ref={ref} />;
});
