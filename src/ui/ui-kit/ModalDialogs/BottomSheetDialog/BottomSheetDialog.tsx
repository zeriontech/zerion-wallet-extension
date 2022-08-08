import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const BottomSheetDialog = React.forwardRef(
  (
    { style, className, ...props }: React.HTMLAttributes<HTMLElement>,
    ref: React.Ref<HTMLElement>
  ) => {
    return (
      <dialog
        ref={ref}
        className={cx(s.slideUp, s.dialog, className)}
        style={{
          border: 'none',
          top: '30vh',
          height: '70vh',
          maxHeight: 'initial',
          width: '100vw',
          maxWidth: 'initial',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: 16,
          boxShadow: '0 0 500px 50px #00000024',
          ...style,
        }}
        {...props}
      />
    );
  }
);
