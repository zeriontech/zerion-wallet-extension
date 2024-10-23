import React from 'react';
import cx from 'classnames';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as styles from './styles.module.css';

export function Circle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx(styles.circle, className)}>
      <UIText kind="small/accent">{children}</UIText>
    </div>
  );
}
