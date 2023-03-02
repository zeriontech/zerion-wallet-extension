import React from 'react';
import cn from 'classnames';
import * as styles from './styles.module.css';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return <input {...props} ref={ref} className={cn(styles.input, className)} />;
});
