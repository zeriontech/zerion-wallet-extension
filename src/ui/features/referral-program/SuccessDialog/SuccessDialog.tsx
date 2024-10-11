import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import RocketSrc from 'src/ui/assets/rocket.png';
import Rocket2xSrc from 'src/ui/assets/rocket@2x.png';
import SuperheroSrc from 'src/ui/assets/superhero.png';
import Superhero2xSrc from 'src/ui/assets/superhero@2x.png';
import PremiumIcon from 'jsx:src/ui/assets/premium.svg';
import ChartIcon from 'jsx:src/ui/assets/chart.svg';
import StarIcon from 'jsx:src/ui/assets/star.svg';
import CsvIcon from 'jsx:src/ui/assets/csv.svg';
import { focusNode } from 'src/ui/shared/focusNode';
import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import { ReferrerLink } from '../shared/ReferrerLink';
import { PremiumTrialBanner } from '../shared/PremiumTrialBanner';
import { FeatureCard } from '../shared/FeatureCard';
import * as styles from './styles.module.css';

export function SuccessDialog({
  referrer,
  onDismiss,
}: {
  referrer: Pick<ReferrerData, 'handle' | 'address'>;
  onDismiss: () => void;
}) {
  return (
    <VStack gap={24} className={styles.successDialog}>
      <VStack gap={0}>
        <DialogTitle
          alignTitle="center"
          title={<UIText kind="headline/h1">Congratulations!</UIText>}
          closeKind="icon"
        />
        {referrer.address ? (
          <UIText kind="small/accent" style={{ textAlign: 'center' }}>
            <ReferrerLink handle={referrer.handle} address={referrer.address} />{' '}
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
      <VStack gap={8}>
        <PremiumTrialBanner width={425} />
        <HStack gap={8} style={{ gridAutoColumns: '1fr 2fr' }}>
          <FeatureCard
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
          <FeatureCard
            icon={<PremiumIcon style={{ width: 36, height: 36 }} />}
            text="Perks for All Wallets"
          />
        </HStack>
        <HStack gap={8} style={{ gridAutoColumns: 'auto 1fr' }}>
          <FeatureCard icon={<ChartIcon />} text="Multichain Profit/Loss" />
          <FeatureCard icon={<StarIcon />} text="Reduced Trading Fees" />
        </HStack>
        <HStack gap={8} style={{ gridAutoColumns: '1fr 2fr' }}>
          <FeatureCard
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
          <FeatureCard icon={<CsvIcon />} text="Download History" />
        </HStack>
      </VStack>
      <Button ref={focusNode} kind="primary" onClick={onDismiss}>
        Awesome!
      </Button>
    </VStack>
  );
}
