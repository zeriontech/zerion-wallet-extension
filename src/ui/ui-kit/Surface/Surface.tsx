import type { ComponentPropsWithRef, ElementType } from 'react';
import React from 'react';

interface Props {
  padding?: React.CSSProperties['padding'];
}

export const Surface = <As extends ElementType = 'div'>({
  style,
  padding,
  as,
  ...props
}: Props & { as?: As } & ComponentPropsWithRef<As>) => {
  return React.createElement(as || 'div', {
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
