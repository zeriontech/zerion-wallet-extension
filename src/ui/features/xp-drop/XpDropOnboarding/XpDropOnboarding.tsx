import React from 'react';
import type { To } from 'react-router-dom';
import { Link, Route, Routes } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useBackgroundKind } from 'src/ui/components/Background';
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

  useBackgroundKind({ kind: 'white' });

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
            imageSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-rewards.png"
            image2xSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-rewards_2x.png"
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
            imageSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-quests.png"
            image2xSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-quests_2x.png"
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
            imageSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-dna.png"
            image2xSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-dna_2x.png"
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
            imageSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-levels.png"
            image2xSrc="https://cdn.zerion.io/images/dna-assets/extension-xp-drop-levels_2x.png"
            buttonText="Check Your Level"
            nextLocation="/xp-drop/onboarding/scoring"
          />
        }
      />
      <Route path="/scoring" element={<XpDropScoring />} />
    </Routes>
  );
}
