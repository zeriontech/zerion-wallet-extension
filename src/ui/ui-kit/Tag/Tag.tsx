import React from 'react';
import cn from 'classnames';
import { UIText } from '../UIText';
import * as styles from './Tag.module.css';

type Kind = 'primary' | 'positive' | 'negative';

export function Tag({
  children,
  className,
  kind = 'primary',
  ...props
}: React.ComponentPropsWithRef<'div'> & { kind?: Kind }) {
  return (
    <div {...props} className={cn(className, styles.tag, styles[kind])}>
      <UIText kind="caption/accent">{children}</UIText>
    </div>
  );
}
