import React from 'react';
import GiftIcon from 'jsx:src/ui/assets/gift.svg';
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
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { GradientBorder } from './GradientBorder';
import * as styles from './styles.module.css';

function GradientText({ children }: { children: React.ReactNode }) {
  return <div className={styles.gradientText}>{children}</div>;
}

function PremiumTrialBanner() {
  return (
    <HStack
      gap={8}
      className={styles.premiumTrialBanner}
      alignItems="center"
      justifyContent="center"
    >
      <GradientBorder width={394} height={48} borderRadius={12} />
      <GiftIcon />
      <GradientText>
        <UIText kind="headline/h3">You got Premium Trial</UIText>
      </GradientText>
    </HStack>
  );
}

function Card({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <VStack gap={0} className={styles.card} style={{ alignItems: 'center' }}>
      <div>{icon}</div>
      <UIText kind="small/accent">{text}</UIText>
    </VStack>
  );
}

export function SuccessDialog({
  referrerWallet,
  onDismiss,
}: {
  referrerWallet: ExternallyOwnedAccount;
  onDismiss: () => void;
}) {
  return (
    <VStack gap={24}>
      <VStack gap={0}>
        <DialogTitle
          alignTitle="center"
          title={<UIText kind="headline/h1">Congratulations!</UIText>}
          closeKind="icon"
        />
        <UIText kind="small/accent" style={{ textAlign: 'center' }}>
          <TextAnchor
            href={`https://app.zerion.io/${referrerWallet.address}/overview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WalletDisplayName wallet={referrerWallet} />
          </TextAnchor>{' '}
          <UIText kind="small/regular" inline={true} color="var(--neutral-500)">
            has invited you!
          </UIText>
        </UIText>
      </VStack>
      <VStack gap={8}>
        <PremiumTrialBanner />
        <HStack gap={8} style={{ gridAutoColumns: '1fr 2fr' }}>
          <Card
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
          <Card
            icon={<PremiumIcon style={{ width: 36, height: 36 }} />}
            text="Perks for All Wallets"
          />
        </HStack>
        <HStack gap={8} style={{ gridAutoColumns: 'auto 1fr' }}>
          <Card icon={<ChartIcon />} text="Multichain Profit/Loss" />
          <Card icon={<StarIcon />} text="Reduced Trading Fees" />
        </HStack>
        <HStack gap={8} style={{ gridAutoColumns: '1fr 2fr' }}>
          <Card
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
          <Card icon={<CsvIcon />} text="Download History" />
        </HStack>
      </VStack>
      <Button ref={focusNode} kind="primary" onClick={onDismiss}>
        Awesome!
      </Button>
    </VStack>
  );
}
