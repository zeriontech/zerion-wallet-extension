import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

// TODO:
// create sizeStore which tracks window innerWidth

const innerWidth = window.innerWidth;

export const CenteredDialog = React.forwardRef(
  (
    { style, className, ...props }: React.HTMLAttributes<HTMLElement>,
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
          maxHeight: isLargeViewport ? '70vh' : 'initial',
          width: '100vw',
          maxWidth: isLargeViewport ? 600 : 'initial',
          borderRadius: isLargeViewport ? 12 : 0,
          padding: 16,
          overflowY: 'auto',
          ...style,
        }}
        {...props}
      />
    );
  }
);
