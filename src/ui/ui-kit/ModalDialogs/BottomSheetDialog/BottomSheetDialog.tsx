import React from 'react';
import cx from 'classnames';
import type { BaseDialogProps } from '../BaseDialog';
import { BaseDialog } from '../BaseDialog';
import * as s from './styles.module.css';

export const BottomSheetDialog = React.forwardRef(
  (
    {
      height = '70vh',
      style,
      className,
      containerStyle,
      ...props
    }: BaseDialogProps & {
      height?: React.CSSProperties['height'];
    },
    ref: React.Ref<HTMLDialogElement>
  ) => {
    return (
      <BaseDialog
        ref={ref}
        className={cx(s.slideUp, s.dialog, className)}
        style={{
          border: 'none',
          bottom: 0,
          position: 'fixed',
          marginBottom: 0,
          padding: 0,
          height,
          maxHeight: 'initial',
          width: '100%',
          maxWidth: 'var(--sheet-dialog-max-width)',
          ...style,
        }}
        containerStyle={{
          backgroundColor: 'var(--z-index-1)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          paddingInline: 16,
          paddingBlock: 24,
          boxShadow: '0 0 500px 50px #00000024',
          ...containerStyle,
        }}
        {...props}
      />
    );
  }
);
