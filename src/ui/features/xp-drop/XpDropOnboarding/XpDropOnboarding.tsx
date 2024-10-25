import React, { useEffect, useRef } from 'react';
import type { To } from 'react-router-dom';
import {
  Link,
  Route,
  Routes,
  unstable_useBlocker as useBlocker,
} from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import LevelsSrc from '../assets/levels.png';
import Levels2xSrc from '../assets/levels@2x.png';
import NewHomeForDnaSrc from '../assets/new-home-for-dna.png';
import NewHomeForDna2xSrc from '../assets/new-home-for-dna@2x.png';
import QuestsSrc from '../assets/quests.png';
import Quests2xSrc from '../assets/quests@2x.png';
import Rewards2xSrc from '../assets/rewards@2x.png';
import RewardsSrc from '../assets/rewards.png';
import { XpDropScoring } from './XpDropScoring';

import * as styles from './styles.module.css';

function WelcomeTo({ title }: { title: string }) {
  return (
    <VStack gap={0}>
      <UIText kind="headline/h3" color="var(--neutral-600)">
        Welcome to
      </UIText>
      <UIText kind="headline/hero" className={styles.gradientText}>
        {title}
      </UIText>
    </VStack>
  );
}

function ExitConfirmationDialog({
  onCancel,
  onExit,
}: {
  onCancel: () => void;
  onExit: () => void;
}) {
  return (
    <VStack gap={24}>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Do you want to exit?</UIText>}
        closeKind="icon"
      />
      <UIText kind="body/regular" color="var(--neutral-400)">
        You can resume claiming your XP whenever you're ready
      </UIText>
      <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button kind="regular" type="button" onClick={onCancel}>
          Back
        </Button>
        <Button kind="primary" onClick={onExit}>
          Exit
        </Button>
      </HStack>
    </VStack>
  );
}

function OnboardingStep({
  title,
  nextLocation,
  buttonText,
  children,
}: {
  title: string;
  nextLocation: To;
  buttonText: string;
  children: React.ReactNode;
}) {
  const exitConfirmationDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      exitConfirmationDialogRef.current?.showModal();
    }
  }, [blocker.state]);

  return (
    <>
      <PageColumn>
        <NavigationTitle title={null} documentTitle={title} />
        <PageTop />
        {children}
      </PageColumn>
      <PageStickyFooter>
        <Button kind="primary" as={Link} to={nextLocation}>
          {buttonText}
        </Button>
        <PageBottom />
      </PageStickyFooter>

      <BottomSheetDialog
        ref={exitConfirmationDialogRef}
        height="fit-content"
        renderWhenOpen={() => (
          <ExitConfirmationDialog
            onCancel={() => {
              exitConfirmationDialogRef.current?.close();
              blocker.reset?.();
            }}
            onExit={() => {
              exitConfirmationDialogRef.current?.close();
              blocker.proceed?.();
            }}
          />
        )}
      />
    </>
  );
}

function Rewards() {
  return (
    <OnboardingStep
      title="Rewards"
      buttonText="Continue"
      nextLocation="/xp-drop/onboarding/quests"
    >
      <VStack gap={32} className={styles.onboardingStep}>
        <WelcomeTo title="Rewards" />
        <img
          alt=""
          src={RewardsSrc}
          srcSet={`${RewardsSrc}, ${Rewards2xSrc} 2x`}
          className={styles.coverImage}
        />
        <UIText kind="headline/h3" style={{ marginTop: -20 }}>
          Unlock exclusive rewards by completing quests using Zerion Wallet
        </UIText>
      </VStack>
    </OnboardingStep>
  );
}

function Quests() {
  return (
    <OnboardingStep
      title="Quests"
      buttonText="Continue"
      nextLocation="/xp-drop/onboarding/new-home-for-dna"
    >
      <VStack gap={32} className={styles.onboardingStep}>
        <WelcomeTo title="Quests" />
        <img
          alt=""
          src={QuestsSrc}
          srcSet={`${QuestsSrc}, ${Quests2xSrc} 2x`}
          className={styles.coverImage}
        />
        <UIText kind="headline/h3">
          Each quest brings you closer to more XP and higher Levels
        </UIText>
      </VStack>
    </OnboardingStep>
  );
}

function NewHomeForDna() {
  return (
    <OnboardingStep
      title="New Home for DNA"
      buttonText="Continue"
      nextLocation="/xp-drop/onboarding/levels"
    >
      <VStack gap={32} className={styles.onboardingStep}>
        <WelcomeTo title="New Home for DNA" />
        <div>
          <img
            alt=""
            src={NewHomeForDnaSrc}
            srcSet={`${NewHomeForDnaSrc}, ${NewHomeForDna2xSrc} 2x`}
          />
        </div>
        <UIText kind="headline/h3" style={{ marginTop: -10 }}>
          All DNA on the wallet will be merged, stats combined and moved to the
          Zero Network
        </UIText>
      </VStack>
    </OnboardingStep>
  );
}

function Levels() {
  return (
    <OnboardingStep
      title="Levels"
      buttonText="Check Your Level"
      nextLocation="/xp-drop/onboarding/scoring"
    >
      <VStack gap={32} className={styles.onboardingStep}>
        <WelcomeTo title="Levels" />
        <div style={{ marginTop: -10 }}>
          <img
            alt=""
            src={LevelsSrc}
            srcSet={`${LevelsSrc}, ${Levels2xSrc} 2x`}
          />
        </div>
        <UIText kind="headline/h3" style={{ marginTop: -150 }}>
          Higher levels unlock unique quests, perks and rewards
        </UIText>
      </VStack>
    </OnboardingStep>
  );
}

export function XpDropOnboarding() {
  return (
    <Routes>
      <Route path="/" element={<Rewards />} />
      <Route path="/quests" element={<Quests />} />
      <Route path="/new-home-for-dna" element={<NewHomeForDna />} />
      <Route path="/levels" element={<Levels />} />
      <Route path="/scoring" element={<XpDropScoring />} />
    </Routes>
  );
}
