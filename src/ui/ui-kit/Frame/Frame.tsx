import React from 'react';
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ElementType,
} from 'react';
import cn from 'classnames';
import * as styles from './styles.module.css';

const FrameElement = <As extends ElementType = 'div'>(
  {
    as,
    className,
    interactiveStyles = false,
    ...props
  }: { as?: As; interactiveStyles?: boolean } & ComponentPropsWithoutRef<As> & {
      ref?: ComponentPropsWithRef<As>['ref'];
    },
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  return React.createElement(as || 'div', {
    ref,
    className: cn(
      className,
      styles.frame,
      interactiveStyles ? styles.interactive : null
    ),
    ...props,
  });
};

export const Frame = React.forwardRef(FrameElement) as typeof FrameElement;
