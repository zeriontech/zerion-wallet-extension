import React from 'react';
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ElementType,
} from 'react';

const FrameElement = <As extends ElementType = 'div'>(
  {
    as,
    style,
    ...props
  }: { as?: As } & ComponentPropsWithoutRef<As> & {
      ref?: ComponentPropsWithRef<As>['ref'];
    },
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  return React.createElement(as || 'div', {
    ref,
    style: {
      backgroundColor: 'var(--frame-background-color)',
      border: '2px solid var(--frame-border-color, var(--neutral-200))',
      borderRadius: 16,
      padding: 8,
      ...style,
    },
    ...props,
  });
};

export const Frame = React.forwardRef(FrameElement) as typeof FrameElement;
