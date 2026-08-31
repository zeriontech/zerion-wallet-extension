import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openHrefInTabView } from 'src/ui/shared/openUrl';
import { usePreloadImages } from 'src/ui/shared/usePreloadImages';
import { DnaBanner } from '../shared/DnaBanner';
import { MINT_DNA_IMAGES, MINT_DNA_WAITING_IMAGES } from '../shared/constants';
import * as styles from './styles.module.css';

const NEXT_STEPS_IMAGES = [...MINT_DNA_IMAGES, ...MINT_DNA_WAITING_IMAGES];

export function MintBanner({
  address,
  onDismiss,
}: {
  address: string;
  onDismiss?(): void;
}) {
  // The banner is a "Continue" step into the mint flow, so preload the
  // images that flow is about to need instead of preloading them for every
  // popup load regardless of whether the user ever opens the banner.
  usePreloadImages(NEXT_STEPS_IMAGES);
  return (
    <DnaBanner
      style={{
        background: 'linear-gradient(277deg, #FFBDFF 0%, #FF7583 100%)',
      }}
      onDismiss={onDismiss}
    >
      <VStack gap={16} style={{ justifyItems: 'start' }}>
        <VStack gap={4}>
          <UIText kind="headline/h3" color="var(--always-white)">
            Mint your Zerion DNA
          </UIText>
          <UIText kind="small/accent" color="var(--always-white)">
            With exclusive attribute
          </UIText>
        </VStack>
        <UnstyledAnchor
          href={`#/mint-dna?address=${address}`}
          target="_blank"
          onClick={openHrefInTabView}
          className={styles.button}
        >
          <UIText kind="small/accent">Continue</UIText>
        </UnstyledAnchor>
      </VStack>
    </DnaBanner>
  );
}
