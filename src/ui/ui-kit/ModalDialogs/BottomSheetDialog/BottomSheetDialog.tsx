import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const BottomSheetDialog = React.forwardRef(
  (
    {
      height = '70vh',
      style,
      className,
      ...props
    }: React.DialogHTMLAttributes<HTMLDialogElement> & {
      height?: React.CSSProperties['height'];
    },
    ref: React.Ref<HTMLDialogElement>
  ) => {
    return (
      <dialog
        ref={ref}
        className={cx(s.slideUp, s.dialog, className)}
        style={{
          border: 'none',
          bottom: 0,
          marginBottom: 0,
          height,
          maxHeight: 'initial',
          width: '100%',
          maxWidth: 'var(--sheet-dialog-max-width)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: 16,
          boxShadow: '0 0 500px 50px #00000024',
          backgroundColor: 'var(--z-index-1)',
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
          ...style,
        }}
        {...props}
      />
    );
  }
);
