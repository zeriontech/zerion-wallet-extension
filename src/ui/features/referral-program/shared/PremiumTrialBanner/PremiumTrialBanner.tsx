import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import GiftIcon from 'jsx:src/ui/assets/gift.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { GradientBorder } from 'src/ui/components/GradientBorder';
import * as styles from './styles.module.css';

function GradientText({ children }: { children: React.ReactNode }) {
  return <div className={styles.gradientText}>{children}</div>;
}

export function PremiumTrialBanner({
  backgroundColor,
}: {
  backgroundColor: string;
}) {
  return (
    <GradientBorder
      borderColor="linear-gradient(80.56deg, #CD657F 7.13%, #8A6DF1 34.59%, #71A1F3 62.04%, #3BB1ED 90.33%)"
      borderWidth={2}
      borderRadius={12}
      backgroundColor={backgroundColor}
    >
      <HStack
        gap={8}
        className={styles.premiumTrialBanner}
        alignItems="center"
        justifyContent="center"
      >
        <GiftIcon />
        <UIText kind="headline/h3" className={styles.gradientText}>You got Premium Trial</UIText>
      </HStack>
    </GradientBorder>
  );
}
