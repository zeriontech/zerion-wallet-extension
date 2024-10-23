import React from 'react';
import RocketSrc from 'src/ui/assets/rocket.png';
import Rocket2xSrc from 'src/ui/assets/rocket@2x.png';
import SuperheroSrc from 'src/ui/assets/superhero.png';
import Superhero2xSrc from 'src/ui/assets/superhero@2x.png';
import PremiumIcon from 'jsx:src/ui/assets/premium.svg';
import ChartIcon from 'jsx:src/ui/assets/chart.svg';
import CsvIcon from 'jsx:src/ui/assets/csv.svg';
import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PremiumTrialBanner } from 'src/ui/features/referral-program/shared/PremiumTrialBanner';
import { ReferrerLink } from 'src/ui/features/referral-program/shared/ReferrerLink';
import { FeatureCard } from 'src/ui/features/referral-program/shared/FeatureCard';
import { HStack } from 'src/ui/ui-kit/HStack';
import * as styles from './styles.module.css';

export function CongratulationsWidget({
  referrer,
}: {
  referrer: ReferrerData;
}) {
  return (
    <VStack gap={24} className={styles.invitationBanner}>
      <HStack gap={32} justifyContent="space-between" alignItems="center">
        <VStack gap={4}>
          <UIText kind="headline/h1">Congratulations!</UIText>
          {referrer.address ? (
            <UIText kind="small/accent" style={{ textAlign: 'left' }}>
              <ReferrerLink
                handle={referrer.handle}
                address={referrer.address}
              />{' '}
              <UIText
                kind="small/regular"
                inline={true}
                color="var(--neutral-500)"
              >
                has invited you!
              </UIText>
            </UIText>
          ) : null}
        </VStack>
        <PremiumTrialBanner />
      </HStack>
      <HStack gap={8} style={{ gridAutoColumns: '1fr 1fr 1fr' }}>
        <VStack gap={8} style={{ alignItems: 'initial' }}>
          <FeatureCard
            className={styles.featureCard}
            icon={<PremiumIcon style={{ width: 36, height: 36 }} />}
            text="Perks for All Wallets"
          />
          <FeatureCard
            className={styles.featureCard}
            icon={
              <img
                alt=""
                style={{ width: 36, height: 36 }}
                src={RocketSrc}
                srcSet={`${RocketSrc}, ${Rocket2xSrc} 2x`}
              />
            }
            text="Early Access"
          />
        </VStack>
        <FeatureCard
          className={styles.chartFeatureCard}
          icon={<ChartIcon />}
          text="Multichain Profit/Loss"
        />
        <VStack gap={8} style={{ alignItems: 'initial' }}>
          <FeatureCard
            className={styles.featureCard}
            icon={
              <img
                alt=""
                style={{ width: 36, height: 36 }}
                src={RocketSrc}
                srcSet={`${SuperheroSrc}, ${Superhero2xSrc} 2x`}
              />
            }
            text="Priority Support"
          />
          <FeatureCard
            className={styles.featureCard}
            icon={<CsvIcon />}
            text="Download History"
          />
        </VStack>
      </HStack>
    </VStack>
  );
}
