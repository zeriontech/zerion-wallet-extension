import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

// TODO:
// create sizeStore which tracks window innerWidth

const innerWidth = window.innerWidth;

export const CenteredDialog = React.forwardRef(
  (
    {
      style,
      className,
      ...props
    }: React.DialogHTMLAttributes<HTMLDialogElement>,
    ref: React.Ref<HTMLDialogElement>
  ) => {
    const isLargeViewport = innerWidth > 600;
    return (
      <dialog
        ref={ref}
        className={cx(s.appear, s.dialog, className)}
        style={{
          border: 'none',
          height: '100vh',
          top: isLargeViewport ? undefined : 0,
          zIndex: 'var(--over-layout-index)',
          maxHeight: isLargeViewport ? '70vh' : 'initial',
          width: '100vw',
          maxWidth: isLargeViewport
            ? 'var(--sheet-dialog-max-width)'
            : 'initial',
          borderRadius: isLargeViewport ? 12 : 0,
          padding: 16,
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
          ...style,
        }}
        {...props}
      />
    );
  }
);
