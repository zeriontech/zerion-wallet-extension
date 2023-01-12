import React from 'react';
import cn from 'classnames';
import { UIText } from '../UIText';
import * as styles from './Tag.module.css';

type Kind = 'primary';

export function Tag({
  children,
  className,
  kind = 'primary',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { kind?: Kind }) {
  return (
    <div {...props} className={cn(className, styles[kind])}>
      <UIText kind="caption/accent" color="var(--neutral-600)">
        {children}
      </UIText>
    </div>
  );
}
