import React from 'react';
import cx from 'classnames';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import * as styles from './styles.module.css';

export function Badge({
  icon,
  text,
  className,
  ...props
}: {
  icon: React.ReactNode;
  text: React.ReactNode;
} & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cx(styles.badge, className)} {...props}>
      <HStack className={styles.badgeContent} gap={6} alignItems="center">
        {icon}
        <UIText kind="small/accent" color="var(--neutral-700)">
          {text}
        </UIText>
      </HStack>
    </div>
  );
}
