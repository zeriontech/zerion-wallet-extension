import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const UnstyledInput = React.forwardRef(
  (
    { className, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => (
    <input
      type="text"
      className={cx(s.input, className)}
      {...props}
      ref={ref}
    />
  )
);
