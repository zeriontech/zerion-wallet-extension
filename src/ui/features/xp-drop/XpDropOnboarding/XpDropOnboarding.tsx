import React, { useRef } from 'react';
import type { To } from 'react-router-dom';
import { Link, Route, Routes } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import LevelsSrc from '../assets/levels.png';
import Levels2xSrc from '../assets/levels@2x.png';
import NewHomeForDnaSrc from '../assets/new-home-for-dna.png';
import NewHomeForDna2xSrc from '../assets/new-home-for-dna@2x.png';
import QuestsSrc from '../assets/quests.png';
import Quests2xSrc from '../assets/quests@2x.png';
import Rewards2xSrc from '../assets/rewards@2x.png';
import RewardsSrc from '../assets/rewards.png';
import { ExitConfirmationDialog } from '../components/ExitConfirmationDialog';
import { XpDropScoring } from './XpDropScoring';

import * as styles from './styles.module.css';

function WelcomeTo({ title }: { title: string }) {
  return (
    <VStack gap={0}>
      <UIText kind="headline/h3" color="var(--neutral-800)">
        Welcome to
      </UIText>
      <UIText kind="headline/hero" className={styles.gradientText}>
        {title}
      </UIText>
    </VStack>
  );
}

function OnboardingStep({
  title,
  text,
  imageSrc,
  image2xSrc,
  nextLocation,
  buttonText,
}: {
  title: string;
  text: string;
  imageSrc: string;
  image2xSrc: string;
  nextLocation: To;
  buttonText: string;
}) {
  // TODO: Show confirmation dialog when the user attempts to navigate back
  const exitConfirmationDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );

  return (
    <>
      <PageColumn>
        <NavigationTitle title={null} documentTitle={title} />
        <VStack gap={32} className={styles.onboardingStep}>
          <WelcomeTo title={title} />
          <img
            alt=""
            src={imageSrc}
            srcSet={`${imageSrc}, ${image2xSrc} 2x`}
            className={styles.coverImage}
          />
          <UIText
            kind="body/accent"
            className={styles.onboardingText}
            color="var(--neutral-700)"
          >
            {text}
          </UIText>
        </VStack>
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
              // TODO: Prevent route change
              exitConfirmationDialogRef.current?.close();
            }}
            onExit={() => {
              // TODO: Allow route change
              exitConfirmationDialogRef.current?.close();
            }}
          />
        )}
      />
    </>
  );
}

export function XpDropOnboarding() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <OnboardingStep
            title="Rewards"
            text="Unlock exclusive rewards by completing quests using Zerion Wallet"
            imageSrc={RewardsSrc}
            image2xSrc={Rewards2xSrc}
            buttonText="Continue"
            nextLocation="/xp-drop/onboarding/quests"
          />
        }
      />
      <Route
        path="/quests"
        element={
          <OnboardingStep
            title="Quests"
            text="Each quest brings you closer to more XP and higher Levels"
            imageSrc={QuestsSrc}
            image2xSrc={Quests2xSrc}
            buttonText="Continue"
            nextLocation="/xp-drop/onboarding/new-home-for-dna"
          />
        }
      />
      <Route
        path="/new-home-for-dna"
        element={
          <OnboardingStep
            title="New Home for DNA"
            text="All DNA on the wallet will be merged, stats combined and moved to the Zero Network"
            imageSrc={NewHomeForDnaSrc}
            image2xSrc={NewHomeForDna2xSrc}
            buttonText="Continue"
            nextLocation="/xp-drop/onboarding/levels"
          />
        }
      />
      <Route
        path="/levels"
        element={
          <OnboardingStep
            title="Levels"
            text="Higher levels unlock unique quests, perks and rewards"
            imageSrc={LevelsSrc}
            image2xSrc={Levels2xSrc}
            buttonText="Check Your Level"
            nextLocation="/xp-drop/onboarding/scoring"
          />
        }
      />
      <Route path="/scoring" element={<XpDropScoring />} />
    </Routes>
  );
}
