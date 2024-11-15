import React from 'react';
import cx from 'classnames';
import type { BaseDialogProps } from '../BaseDialog';
import { BaseDialog } from '../BaseDialog';
import * as s from './styles.module.css';

export enum AnimationPreset {
  slideUp,
  slideUpNoFadeIn,
}

const animationStyles = {
  [AnimationPreset.slideUp]: s.slideUp,
  [AnimationPreset.slideUpNoFadeIn]: s.slideUpNoFadeIn,
} as const;

export const BottomSheetDialog = React.forwardRef(
  (
    {
      height = '70vh',
      style,
      className,
      containerStyle,
      animationPreset = AnimationPreset.slideUp,
      displayGrid = false,
      ...props
    }: BaseDialogProps & {
      height?: React.CSSProperties['height'];
      animationPreset?: AnimationPreset;
      displayGrid?: boolean;
    },
    ref: React.Ref<HTMLDialogElement>
  ) => {
    return (
      <BaseDialog
        ref={ref}
        className={cx(
          animationStyles[animationPreset],
          s.dialog,
          className,
          displayGrid ? s.displayGrid : null
        )}
        style={{
          border: 'none',
          bottom: 0,
          marginBottom: 0,
          padding: 0,
          height,
          maxHeight: 'initial',
          width: '100%',
          maxWidth: 'var(--sheet-dialog-max-width)',
          ...style,
        }}
        containerStyle={{
          backgroundColor: 'var(--z-index-0)',
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
