import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import cx from 'classnames';
import * as styles from './styles.module.css';

export function FeatureCard({
  icon,
  iconStyle,
  text,
  className,
  style,
  ...props
}: {
  icon: React.ReactNode;
  iconStyle?: React.CSSProperties;
  text: React.ReactNode;
} & React.HTMLProps<HTMLDivElement>) {
  return (
    <VStack
      gap={0}
      className={cx(styles.featureCard, className)}
      style={{ alignItems: 'center', ...style }}
      {...props}
    >
      <div style={iconStyle}>{icon}</div>
      <UIText kind="small/accent">{text}</UIText>
    </VStack>
  );
}
