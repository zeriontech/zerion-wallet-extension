import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import React from 'react';

interface Props {
  padding?: React.CSSProperties['padding'];
}

export const SurfaceComponent = <As extends ElementType = 'div'>(
  {
    style,
    padding,
    as,
    ...props
  }: Props & { as?: As } & ComponentPropsWithoutRef<As> & {
      ref?: ComponentPropsWithRef<As>['ref'];
    },
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  return React.createElement(as || 'div', {
    ref,
    style: {
      ['--surface-border-radius']: '12px',
      ['--local-surface-background-color']:
        'var(--surface-background-color, var(--z-index-1))',
      borderRadius: 'var(--surface-border-radius)',
      backgroundColor: 'var(--local-surface-background-color)',
      padding,
      ...style,
    },
    ...props,
  });
};

export const Surface = React.forwardRef(
  SurfaceComponent
) as typeof SurfaceComponent;
