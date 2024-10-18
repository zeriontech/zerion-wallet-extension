import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import GiftIcon from 'jsx:src/ui/assets/gift.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { GradientBorder } from '../GradientBorder';
import * as styles from './styles.module.css';

function GradientText({ children }: { children: React.ReactNode }) {
  return <div className={styles.gradientText}>{children}</div>;
}

export function PremiumTrialBanner({ width }: { width: number }) {
  return (
    <HStack
      gap={8}
      className={styles.premiumTrialBanner}
      alignItems="center"
      justifyContent="center"
    >
      <GradientBorder width={width - 4 * 2} height={48} borderRadius={12} />
      <GiftIcon />
      <GradientText>
        <UIText kind="headline/h3">You got Premium Trial</UIText>
      </GradientText>
    </HStack>
  );
}
