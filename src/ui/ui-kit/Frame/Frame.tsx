import React from 'react';
import type { ElementType } from 'react';
import cn from 'classnames';
import type { PropsWithAs } from 'src/shared/type-utils/PropsWithAs';
import * as styles from './styles.module.css';

export const Frame = <As extends ElementType = 'div'>({
  as,
  ref,
  className,
  interactiveStyles = false,
  ...props
}: { interactiveStyles?: boolean } & PropsWithAs<As>) => {
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
