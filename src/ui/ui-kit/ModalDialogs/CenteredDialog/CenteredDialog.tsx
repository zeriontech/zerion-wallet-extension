import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const CenteredDialog = React.forwardRef(
  (
    { style, className, ...props }: React.HTMLAttributes<HTMLElement>,
    ref: React.Ref<HTMLElement>
  ) => {
    return (
      <dialog
        ref={ref}
        className={cx(s.appear, s.dialog, className)}
        style={{
          border: 'none',
          height: '100vh',
          maxHeight: 'initial',
          width: '100vw',
          maxWidth: 'initial',
          borderRadius: 0,
          padding: 16,
          ...style,
        }}
        {...props}
      />
    );
  }
);
